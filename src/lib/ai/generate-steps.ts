import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { GENERATE_STEPS_SYSTEM_PROMPT } from "./prompts";

const testStepsSchema = z.object({
  steps: z.array(
    z.object({
      type: z.enum(["act", "assert"]),
      description: z.string(),
    })
  ),
});

export async function generateTestSteps(
  websiteUrl: string,
  description: string
) {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: testStepsSchema,
    system: GENERATE_STEPS_SYSTEM_PROMPT,
    prompt: `Website: ${websiteUrl}\n\nTest description: ${description}`,
  });

  return object.steps;
}
