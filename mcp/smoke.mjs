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
    let value = m[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

const env = { ...process.env, ...loadDotEnv(envFile), TESTER_ARMY_STATE_DIR: resolve(__dirname, ".smoke-state") };

const required = ["ANTHROPIC_API_KEY", "BROWSERBASE_API_KEY", "BROWSERBASE_PROJECT_ID"];
const missing = required.filter((k) => !env[k]);
if (missing.length) {
  console.error("Missing env:", missing.join(", "));
  process.exit(1);
}

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
    try {
      msg = JSON.parse(line);
    } catch {
      continue;
    }
    if (msg.id != null && pending.has(msg.id)) {
      const { resolve } = pending.get(msg.id);
      pending.delete(msg.id);
      resolve(msg);
    }
  }
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(`[server stderr] ${chunk}`);
});

function rpc(method, params) {
  const id = nextId++;
  const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
  return new Promise((resolveFn, rejectFn) => {
    pending.set(id, { resolve: resolveFn, reject: rejectFn });
    child.stdin.write(payload);
  });
}

function notify(method, params) {
  const payload = JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n";
  child.stdin.write(payload);
}

async function callTool(name, args) {
  const res = await rpc("tools/call", { name, arguments: args });
  if (res.error) throw new Error(`${name} rpc error: ${JSON.stringify(res.error)}`);
  const text = res.result?.content?.[0]?.text;
  const parsed = text ? JSON.parse(text) : null;
  return { isError: Boolean(res.result?.isError), data: parsed };
}

function header(label) {
  console.log(`\n=== ${label} ===`);
}

try {
  header("initialize");
  const init = await rpc("initialize", {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: { name: "smoke", version: "0" },
  });
  console.log(JSON.stringify(init.result.serverInfo));
  notify("notifications/initialized", {});

  header("tools/list");
  const tools = await rpc("tools/list", {});
  console.log("tools:", tools.result.tools.map((t) => t.name).join(", "));

  header("propose_tests (https://example.com)");
  const proposal = await callTool("propose_tests", {
    url: "https://example.com",
    intent:
      "Verify the homepage of example.com renders correctly: the 'Example Domain' heading is visible, the body paragraph mentions 'illustrative examples', and the 'More information...' link points to iana.org.",
    count: 2,
  });
  if (proposal.isError)
    throw new Error(`propose_tests failed: ${JSON.stringify(proposal.data)}`);
  console.log("suiteId:", proposal.data.suiteId);
  console.log("projectId:", proposal.data.projectId);
  console.log("projectReused:", proposal.data.projectReused);
  for (const t of proposal.data.tests) {
    console.log(`  - ${t.testId}  ${t.name}`);
    for (const s of t.steps) console.log(`      [${s.type}] ${s.description}`);
  }
  if (proposal.data.warnings?.length) console.log("warnings:", proposal.data.warnings);
  const suiteId = proposal.data.suiteId;

  header("run_tests");
  const t0 = Date.now();
  const run = await callTool("run_tests", { suiteId });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  if (run.isError) {
    console.log(`run_tests returned isError after ${elapsed}s:`, run.data);
  } else {
    console.log(
      `run_tests finished in ${elapsed}s — ${run.data.summary.passed}/${run.data.summary.total} passed, ${run.data.summary.failed} failed`
    );
    for (const r of run.data.results) {
      console.log(`\n  test ${r.testId}  ${r.name}  -> ${r.status}`);
      if (r.recordingUrl) console.log(`    recordingUrl: ${r.recordingUrl}`);
      for (const s of r.steps) {
        console.log(
          `      ${s.stepIndex}. ${s.status}${
            s.screenshotPath ? `  (screenshot: ${s.screenshotPath})` : ""
          }`
        );
      }
      if (r.failure) {
        console.log("    failure:");
        console.log("      cause:", r.failure.cause);
        console.log("      fix:  ", r.failure.fix);
        console.log("      repro:");
        for (const line of r.failure.repro) console.log("        -", line);
      }
    }
  }
} catch (err) {
  console.error("\nSMOKE FAILED:", err);
  process.exitCode = 1;
} finally {
  child.kill();
}
