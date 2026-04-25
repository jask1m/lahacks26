import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { TestStep } from "@/lib/supabase/types";
import {
  executableActionsSchema,
  type ExecutableAction,
} from "@/lib/execution/actions";
import { GENERATE_STEPS_SYSTEM_PROMPT } from "./prompts";

const COMPILE_VERSION = 1;

const testStepsSchema = z.object({
  steps: z.array(
    z.object({
      type: z.enum(["act", "assert", "auth"]),
      description: z.string(),
    })
  ),
});

const STEP_COMPILER_SYSTEM_PROMPT = `You compile human-written browser test steps into deterministic Playwright-style tool calls.

Only use these actions:
- navigate: Go to a URL. Requires "url".
- click: Click an element. Requires "selector".
- type: Fill an input. Requires "selector" and "value".
- waitForSelector: Wait for an element to appear. Requires "selector".
- assertVisible: Verify an element is visible. Requires "selector".
- assertText: Verify text exists on the page. Requires "value".
- assertLink: Verify a link exists and points to a URL. Requires "selector" and "url".
- goBack: Navigate back.
- scroll: Scroll the page.

Rules:
- Return the smallest action list that fully executes the step.
- Prefer stable selectors: role=, text=, labels, placeholders, then CSS.
- Do not invent credentials or auth actions.
- For navigation steps, prefer absolute URLs.
- For simple text verification, prefer assertText over brittle selectors.`;

function normalizePath(path: string) {
  if (!path.startsWith("/")) {
    return `/${path}`;
  }

  return path;
}

function tryCompileHeuristically(
  websiteUrl: string,
  step: Pick<TestStep, "type" | "description">
): ExecutableAction[] | null {
  const description = step.description.trim();
  const lower = description.toLowerCase();

  if (step.type === "auth") {
    return null;
  }

  if (step.type === "act") {
    if (
      /\b(navigate|open|visit|go to)\b/.test(lower) &&
      /\b(home|homepage|landing page|site|website)\b/.test(lower)
    ) {
      return [
        {
          action: "navigate",
          url: websiteUrl,
          description,
        },
      ];
    }

    const pathMatch = description.match(
      /\b(?:navigate|open|visit|go to)\s+(?:the\s+)?([/][\w\-./?=&%#]+)\b/i
    );
    if (pathMatch) {
      return [
        {
          action: "navigate",
          url: new URL(normalizePath(pathMatch[1]), websiteUrl).toString(),
          description,
        },
      ];
    }
  }

  if (step.type === "assert") {
    const quotedText = description.match(/["“](.+?)["”]/);
    if (quotedText) {
      return [
        {
          action: "assertText",
          value: quotedText[1],
          description,
        },
      ];
    }

    const simpleTextMatch = description.match(
      /\b(?:verify|confirm|assert|check)\s+(?:that\s+)?(.+?)\s+(?:is|are)\s+(?:visible|displayed|shown)\b/i
    );
    if (simpleTextMatch) {
      return [
        {
          action: "assertText",
          value: simpleTextMatch[1].trim(),
          description,
        },
      ];
    }
  }

  return null;
}

export async function compileStepForExecution(
  websiteUrl: string,
  step: Pick<TestStep, "type" | "description">
): Promise<{
  compiledActions?: ExecutableAction[];
  compileStatus: TestStep["compileStatus"];
  compileNotes?: string;
}> {
  if (step.type === "auth") {
    return {
      compileStatus: "compiled",
      compileNotes: "Auth steps use the configured auth executor.",
    };
  }

  const heuristicActions = tryCompileHeuristically(websiteUrl, step);
  if (heuristicActions) {
    return {
      compiledActions: heuristicActions,
      compileStatus: "compiled",
      compileNotes: "Compiled without a model call using a deterministic heuristic.",
    };
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-20250514"),
      schema: executableActionsSchema,
      system: STEP_COMPILER_SYSTEM_PROMPT,
      prompt: `Website: ${websiteUrl}
Step type: ${step.type}
Step description: ${step.description}

Compile this single step into deterministic actions.`,
    });

    return {
      compiledActions: object.actions,
      compileStatus: "compiled",
      compileNotes: "Compiled from the natural-language step.",
    };
  } catch (error) {
    return {
      compileStatus: "failed",
      compileNotes:
        error instanceof Error ? error.message : "Step compilation failed.",
    };
  }
}

export async function generateTestSteps(
  websiteUrl: string,
  description: string,
  authConfigured: boolean
) {
  void authConfigured;
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: testStepsSchema,
    system: GENERATE_STEPS_SYSTEM_PROMPT,
    prompt: `Website: ${websiteUrl}
Test description: ${description}`,
  });

  const compiledSteps = await Promise.all(
    object.steps.map(async (step) => {
      const compilation = await compileStepForExecution(websiteUrl, step);

      return {
        ...step,
        compiledActions: compilation.compiledActions,
        compileStatus: compilation.compileStatus ?? "pending",
        compileVersion: COMPILE_VERSION,
        compileNotes: compilation.compileNotes,
        fallbackPolicy: "llm_on_failure" as const,
      };
    })
  );

  return compiledSteps;
}

export { COMPILE_VERSION };
