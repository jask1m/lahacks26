import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envFile = resolve(__dirname, "../.env.local");

function loadDotEnv(file) {
  if (!existsSync(file)) return {};
  const raw = readFileSync(file, "utf8");
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const env = {
  ...process.env,
  ...loadDotEnv(envFile),
  DEEPCRAWL_STATE_DIR: resolve(__dirname, ".smoke-state"),
};

const child = spawn(process.execPath, [resolve(__dirname, "dist/index.js")], {
  env,
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
const pending = new Map();
let nextId = 1;

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString("utf8");
  let idx;
  while ((idx = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, idx).trim();
    buffer = buffer.slice(idx + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id != null && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg);
      pending.delete(msg.id);
    }
  }
});

child.stderr.on("data", (c) => process.stderr.write(`[server stderr] ${c}`));

function rpc(method, params) {
  const id = nextId++;
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}
function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}
async function callTool(name, args) {
  const res = await rpc("tools/call", { name, arguments: args });
  if (res.error) throw new Error(JSON.stringify(res.error));
  const text = res.result?.content?.[0]?.text;
  return { isError: Boolean(res.result?.isError), data: text ? JSON.parse(text) : null };
}

try {
  await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke-fail", version: "0" },
  });
  notify("notifications/initialized", {});

  console.log("=== propose_tests (intentional failure) ===");
  const proposal = await callTool("propose_tests", {
    url: "https://example.com",
    intent:
      "Verify the example.com homepage contains the exact text 'This sentence absolutely does not appear on example.com 12345 zxcv'.",
    count: 1,
  });
  if (proposal.isError) throw new Error(JSON.stringify(proposal.data));
  console.log("suiteId:", proposal.data.suiteId);
  for (const t of proposal.data.tests) {
    console.log(`  - ${t.testId}  ${t.name}`);
    for (const s of t.steps) console.log(`      [${s.type}] ${s.description}`);
  }
  const suiteId = proposal.data.suiteId;

  console.log("\n=== run_tests (expecting failure) ===");
  const t0 = Date.now();
  const run = await callTool("run_tests", { suiteId });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(
    `finished in ${elapsed}s — ${run.data.summary.passed}/${run.data.summary.total} passed, ${run.data.summary.failed} failed`
  );
  for (const r of run.data.results) {
    console.log(`\ntest ${r.testId}  ${r.name}  -> ${r.status}`);
    if (r.recordingUrl) console.log("  recordingUrl:", r.recordingUrl);
    console.log("  step results:");
    for (const s of r.steps) console.log(`    ${s.stepIndex}. ${s.status}`);
    if (r.failure) {
      console.log("  structured failure report:");
      console.log("    cause:", r.failure.cause);
      console.log("    fix:  ", r.failure.fix);
      console.log("    repro:");
      for (const line of r.failure.repro) console.log("      -", line);
    }
  }
} catch (err) {
  console.error("SMOKE-FAIL ERR:", err);
  process.exitCode = 1;
} finally {
  child.kill();
}
