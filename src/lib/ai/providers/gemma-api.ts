import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const GEMMA_API_MODEL_ID = "gemma-3-27b-it";

export function getGemmaApiModel() {
  const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMMA_KEY,
  });
  return google(GEMMA_API_MODEL_ID);
}
