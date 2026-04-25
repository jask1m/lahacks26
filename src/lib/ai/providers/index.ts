import { getClaudeModel } from "./claude";
import { getGemmaApiModel } from "./gemma-api";
import { getGemmaVultrModel } from "./gemma-vultr";

export type AIProvider = "gemma-api" | "gemma-vultr" | "claude";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider | undefined;

  if (provider === "gemma-api" || provider === "gemma-vultr" || provider === "claude") {
    return provider;
  }

  return "gemma-api";
}

export function getModel() {
  const provider = getAIProvider();

  switch (provider) {
    case "gemma-api":
      return getGemmaApiModel();
    case "gemma-vultr":
      return getGemmaVultrModel();
    case "claude":
    default:
      return getClaudeModel();
  }
}

export { getClaudeModel } from "./claude";
export { getGemmaApiModel } from "./gemma-api";
export { getGemmaVultrModel } from "./gemma-vultr";
