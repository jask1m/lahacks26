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
          return toJsonContent(result);
        } catch (err) {
          return toErrorContent(err);
        }
      }
    );
  }

  return server;
}
