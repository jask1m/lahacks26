import { cookies } from "next/headers";
import { getClaudeModel } from "./claude";
import { getGemmaApiModel } from "./gemma-api";
import { getGemmaVultrModel } from "./gemma-vultr";

export type AIProvider = "gemma-api" | "gemma-vultr" | "claude";

async function getProviderFromCookies(): Promise<AIProvider | null> {
  try {
    const cookieStore = await cookies();
    const settingsCookie = cookieStore.get("compute-settings");
    
    if (settingsCookie) {
      const settings = JSON.parse(settingsCookie.value);
      if (settings.cloudCompute) {
        return "gemma-vultr";
      }
      if (settings.model === "claude") {
        return "claude";
      }
      if (settings.model === "gemma") {
        return "gemma-api";
      }
    }
  } catch {
    // Ignore cookie parsing errors
  }
  return null;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER as AIProvider | undefined;

  if (provider === "gemma-api" || provider === "gemma-vultr" || provider === "claude") {
    return provider;
  }

  return "gemma-api";
}

export async function getModel() {
  // First check UI settings from cookies
  const cookieProvider = await getProviderFromCookies();
  const provider = cookieProvider ?? getAIProvider();
  
  console.log(`[AI Provider] Using: ${provider}`);

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
