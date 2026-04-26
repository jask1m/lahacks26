export type AIProvider = "gemma-api" | "gemma-vultr" | "claude";

async function getProviderFromCookies(): Promise<AIProvider | null> {
  try {
    // Dynamically import next/headers so this module remains usable outside a
    // Next.js server runtime (e.g. the standalone MCP server process). In any
    // non-request context the import or cookies() call will throw and we fall
    // through to the env-based selection below.
    const { cookies } = await import("next/headers");
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
    // Not in a Next.js request scope, or cookie missing/malformed — ignore.
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
  // Prefer the provider chosen via the dashboard's compute-settings cookie
  // (Next.js request scope only); otherwise fall back to AI_PROVIDER env /
  // the default. Log to stderr — stdout is reserved for MCP JSON-RPC.
  const cookieProvider = await getProviderFromCookies();
  const provider = cookieProvider ?? getAIProvider();
  console.error(`[AI Provider] Using: ${provider}`);

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
export async function getStructuredModel() {
  const cookieProvider = await getProviderFromCookies();
  const provider = cookieProvider ?? getAIProvider();

  // Google's gemma API model currently fails for generateObject/json mode.
  // Fall back to Claude for structured outputs.
  if (provider === "gemma-api") {
    return (await import("./claude")).getClaudeModel();
  }

  return getModel();
}
