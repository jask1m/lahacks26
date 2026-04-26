import { build } from "esbuild";
import { chmodSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outfile = resolve(__dirname, "dist/index.js");

mkdirSync(resolve(__dirname, "dist"), { recursive: true });

await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  outfile,
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  packages: "external",
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
  chmodSync(outfile, 0o755);
} catch {
  // chmod may fail on Windows; the shebang still helps on Unix.
}
