import { generateObject } from "ai";
import { getStructuredModel } from "@/lib/ai/providers";
import { z } from "zod";
import type { TestStep } from "@/lib/supabase/types";
import {
  executableActionsSchema,
  type ExecutableAction,
} from "@/lib/execution/actions";
import { GENERATE_STEPS_SYSTEM_PROMPT, GENERATE_TEST_SUITE_SYSTEM_PROMPT } from "./prompts";

const COMPILE_VERSION = 1;

const testStepsSchema = z.object({
  steps: z.array(
    z.object({
      type: z.enum(["act", "assert", "auth"]),
      description: z.string(),
    })
  ),
});

const testSuiteSchema = z.object({
  tests: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      steps: z.array(
        z.object({
          type: z.enum(["act", "assert", "auth"]),
          description: z.string(),
        })
      ),
    })
  ),
});

const STEP_COMPILER_SYSTEM_PROMPT = `You compile human-written browser test steps into deterministic Playwright-style tool calls.

Only use these actions:
- navigate: Go to a URL. Requires "url".
- click: Click an element. Requires "selector".
- type: Fill an input. Requires "selector" and "value".
- uploadFile: Upload a file through an <input type="file">. Requires "selector" and "value" (file path).
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
- For simple text verification, prefer assertText over brittle selectors.
- For file upload steps, prefer uploadFile with stable input selectors.
- For the demo upload page, prefer selector [data-testid='upload-input'].
- The demo upload page path is /demo-store/demo-upload (not /demo-store/upload).
- Use deterministic fixture path fixtures/uploads/sample-upload.txt when a file is needed.`;

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
      /\b(upload|file upload)\b/.test(lower) &&
      /\b(page|screen|demo)\b/.test(lower)
    ) {
      return [
        {
          action: "navigate",
          url: new URL("/demo-store/demo-upload", websiteUrl).toString(),
          description,
        },
      ];
    }

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

    if (
      /\b(upload|attach|choose file|select file|file upload|drag and drop)\b/.test(
        lower
      )
    ) {
      return [
        {
          action: "uploadFile",
          selector: "[data-testid='upload-input']",
          value: "fixtures/uploads/sample-upload.txt",
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
      model: await getStructuredModel(),
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
    model: await getStructuredModel(),
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

async function compileGeneratedSteps(
  websiteUrl: string,
  steps: ReadonlyArray<{ type: "act" | "assert" | "auth"; description: string }>
) {
  return Promise.all(
    steps.map(async (step) => {
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
}

export interface GeneratedSuiteTest {
  name: string;
  description: string;
  steps: Awaited<ReturnType<typeof compileGeneratedSteps>>;
}

/**
 * Generate `count` distinct, non-overlapping tests from a single high-level
 * intent in one Claude call. The model sees all candidates at once so it can
 * deduplicate and cover happy/error/edge paths coherently.
 */
export async function generateTestSuite(
  websiteUrl: string,
  intent: string,
  count: number
): Promise<GeneratedSuiteTest[]> {
  const clamped = Math.max(1, Math.min(10, Math.floor(count)));
  const { object } = await generateObject({
    model: await getStructuredModel(),
    schema: testSuiteSchema,
    system: GENERATE_TEST_SUITE_SYSTEM_PROMPT,
    prompt: `Website: ${websiteUrl}
Suite intent: ${intent}
Number of tests to propose: ${clamped}

Produce exactly ${clamped} distinct tests covering different behaviors implied by the intent.`,
  });

  const trimmed = object.tests.slice(0, clamped);
  return Promise.all(
    trimmed.map(async (test) => ({
      name: test.name,
      description: test.description,
      steps: await compileGeneratedSteps(websiteUrl, test.steps),
    }))
  );
}

export { COMPILE_VERSION };
