export type AIProvider = "gemma-api" | "gemma-vultr" | "claude";

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider | undefined;

  if (provider === "gemma-api" || provider === "gemma-vultr" || provider === "claude") {
    return provider;
  }

  return "gemma-api";
}

export async function getModel() {
  const provider = getAIProvider();

  switch (provider) {
    case "gemma-api":
      return (await import("./gemma-api")).getGemmaApiModel();
    case "gemma-vultr":
      return (await import("./gemma-vultr")).getGemmaVultrModel();
    case "claude":
    default:
      return (await import("./claude")).getClaudeModel();
  }
}
