import { createOpenAI } from "@ai-sdk/openai";

export const GEMMA_VULTR_MODEL_ID = "gemma-3-27b-it";

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
  const vultrOpenAI = createOpenAI({
    baseURL: `${getVultrBaseUrl()}/v1`,
    apiKey: process.env.VULTR_GEMMA_API_KEY || "not-needed",
  });

  return vultrOpenAI(GEMMA_VULTR_MODEL_ID);
}
