import { createOpenAI } from "@ai-sdk/openai";

// Ollama uses different model names than HuggingFace
export const GEMMA_VULTR_MODEL_ID = process.env.VULTR_GEMMA_MODEL || "gemma3:27b";

function getVultrBaseUrl(): string {
  const url = process.env.VULTR_GEMMA_URL;
  if (!url) {
    throw new Error(
      "VULTR_GEMMA_URL environment variable is required for gemma-vultr provider"
    );
  }
  return url;
}

export function getGemmaVultrModel() {
  const baseUrl = getVultrBaseUrl();
  // Don't append /v1 if it's already in the URL
  const finalUrl = baseUrl.endsWith("/v1") ? baseUrl : `${baseUrl}/v1`;
  
  const vultrOpenAI = createOpenAI({
    baseURL: finalUrl,
    apiKey: process.env.VULTR_GEMMA_API_KEY || "not-needed",
  });

  return vultrOpenAI(GEMMA_VULTR_MODEL_ID);
}
