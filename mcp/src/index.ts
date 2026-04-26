import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { buildServer } from "./server.js";

async function main() {
  // The MCP server only documents/configures ANTHROPIC_API_KEY (see README),
  // so default the shared provider selector to Claude unless the user has
  // explicitly overridden it. Without this, getAIProvider() falls back to
  // "gemma-api" and tool calls fail because GEMMA_KEY isn't set.
  process.env.AI_PROVIDER ??= "claude";

  // Surface env warnings to stderr so they show up in the agent's MCP logs
  // without polluting stdout (which carries the JSON-RPC protocol).
  const missingEnv: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missingEnv.push("ANTHROPIC_API_KEY");
  if (!process.env.BROWSERBASE_API_KEY) missingEnv.push("BROWSERBASE_API_KEY");
  if (!process.env.BROWSERBASE_PROJECT_ID) missingEnv.push("BROWSERBASE_PROJECT_ID");
  if (missingEnv.length) {
    process.stderr.write(
      `[tester-army-mcp] Warning: missing env vars (${missingEnv.join(", ")}). ` +
        `Tool calls that need them will fail until you set them in your MCP client config.\n`
    );
  }

  const server = buildServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const message = err instanceof Error ? err.stack || err.message : String(err);
  process.stderr.write(`[tester-army-mcp] fatal: ${message}\n`);
  process.exit(1);
});
