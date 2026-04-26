import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZodObject, ZodRawShape } from "zod";

import { allTools, type ToolDefinition } from "./tools.js";

function toJsonContent(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function toFormattedContent(formatted: string, value: unknown) {
  // First block: the pre-rendered user-facing report wrapped in markers, with
  // a strict "print verbatim" directive. MCP clients render the first text
  // block prominently in the tool-call expansion, and the agent is much more
  // reliable at copying a delimited string than at following a format spec.
  // Second block: the structured JSON for the agent's programmatic reference
  // only — explicitly marked as not for user display.
  const reportBlock =
    "USER-FACING REPORT — reply to the user with the EXACT contents between the <<<REPORT>>> and <<<END>>> markers below, verbatim, with no prefix, suffix, paraphrasing, or summary. Do not wrap the report in your own narrative.\n\n" +
    "<<<REPORT>>>\n" +
    formatted +
    "\n<<<END>>>";
  const internalBlock =
    "INTERNAL — for your reference only, do not surface to the user:\n" +
    JSON.stringify(value, null, 2);
  return {
    content: [
      { type: "text" as const, text: reportBlock },
      { type: "text" as const, text: internalBlock },
    ],
  };
}

function toErrorContent(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ error: message }, null, 2),
      },
    ],
  };
}

export function buildServer(): McpServer {
  const server = new McpServer({
    name: "tester-army-mcp",
    version: "0.1.0",
  });

  for (const tool of allTools as readonly ToolDefinition<unknown, unknown>[]) {
    // The SDK's registerTool expects a ZodRawShape (the .shape of an object).
    const shape = (tool.inputSchema as unknown as ZodObject<ZodRawShape>).shape;

    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: shape,
      },
      async (args: unknown) => {
        try {
          const result = await tool.handler(args);
          if (tool.format) {
            const formatted = tool.format(result);
            return toFormattedContent(formatted, result);
          }
          return toJsonContent(result);
        } catch (err) {
          return toErrorContent(err);
        }
      }
    );
  }

  return server;
}
