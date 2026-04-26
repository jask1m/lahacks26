import { anthropic } from "@ai-sdk/anthropic";

export const CLAUDE_MODEL_ID = "claude-sonnet-4-20250514";

export function getClaudeModel() {
  return anthropic(CLAUDE_MODEL_ID);
}
