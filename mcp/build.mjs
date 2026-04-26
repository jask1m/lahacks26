import { build } from "esbuild";
import { chmodSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outdir = resolve(__dirname, "dist");
const entryOutfile = resolve(outdir, "index.js");

mkdirSync(outdir, { recursive: true });

// `splitting: true` is required so that dynamic `import("./gemma-api")` etc.
// in src/lib/ai/providers/index.ts produce separate chunks instead of being
// inlined into the entry bundle. Without it, the unused providers' top-level
// `import "@ai-sdk/google"` and `import "@ai-sdk/openai"` get hoisted into
// dist/index.js and Node tries to resolve them at startup, crashing the MCP
// when those packages aren't installed (the MCP only depends on Anthropic).
await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  outdir,
  entryNames: "index",
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
  splitting: true,
  sourcemap: true,
  banner: {
    js: [
      "#!/usr/bin/env node",
      "import { createRequire } from 'node:module';",
      "const require = createRequire(import.meta.url);",
    ].join("\n"),
  },
  tsconfig: resolve(__dirname, "tsconfig.json"),
  logLevel: "info",
});

try {
  chmodSync(entryOutfile, 0o755);
} catch {
  // chmod may fail on Windows; the shebang still helps on Unix.
}
