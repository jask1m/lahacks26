import { generateObject } from "ai";
import { getStructuredModel } from "@/lib/ai/providers";
import { z } from "zod";
import type { TestStep } from "@/lib/supabase/types";
import {
  executableActionSchema,
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

  const compiledSteps = await compileStepBatch(websiteUrl, object.steps);

  return compiledSteps;
}

const BATCH_COMPILE_LIMIT = 30;

const batchedCompileSchema = z.object({
  steps: z.array(
    z.object({
      index: z.number().int(),
      actions: z.array(executableActionSchema),
    })
  ),
});

const BATCH_COMPILER_SYSTEM_PROMPT = `${STEP_COMPILER_SYSTEM_PROMPT}

You will receive multiple steps in one call. Return a "steps" array containing exactly one entry per input index, preserving the original index values. Each entry's "actions" must be the deterministic action list for that step alone.`;

async function compileStepsBatched(
  websiteUrl: string,
  steps: ReadonlyArray<{
    index: number;
    type: "act" | "assert";
    description: string;
  }>
): Promise<Map<number, ExecutableAction[]>> {
  const result = new Map<number, ExecutableAction[]>();
  if (steps.length === 0) return result;

  const lines = steps
    .map((s) => `- index=${s.index} (${s.type}): ${s.description}`)
    .join("\n");

  const { object } = await generateObject({
    model: await getStructuredModel(),
    schema: batchedCompileSchema,
    system: BATCH_COMPILER_SYSTEM_PROMPT,
    prompt: `Website: ${websiteUrl}

Compile each step below into deterministic actions. Return one object per input index, preserving indices.

Steps:
${lines}`,
  });

  const requestedIndices = new Set(steps.map((s) => s.index));
  for (const entry of object.steps) {
    if (requestedIndices.has(entry.index) && Array.isArray(entry.actions)) {
      result.set(entry.index, entry.actions);
    }
  }
  return result;
}

type RawStep = {
  type: "act" | "assert" | "auth";
  description: string;
};

type CompiledStep = RawStep & {
  compiledActions?: ExecutableAction[];
  compileStatus: NonNullable<
    Awaited<ReturnType<typeof compileStepForExecution>>["compileStatus"]
  >;
  compileVersion: number;
  compileNotes?: string;
  fallbackPolicy: "llm_on_failure";
};

async function compileStepBatch(
  websiteUrl: string,
  rawSteps: ReadonlyArray<RawStep>
): Promise<CompiledStep[]> {
  const out: CompiledStep[] = new Array(rawSteps.length);
  const needsModel: {
    index: number;
    type: "act" | "assert";
    description: string;
  }[] = [];
  let heuristicHits = 0;

  rawSteps.forEach((step, i) => {
    if (step.type === "auth") {
      out[i] = {
        ...step,
        compileStatus: "compiled",
        compileVersion: COMPILE_VERSION,
        compileNotes: "Auth steps use the configured auth executor.",
        fallbackPolicy: "llm_on_failure",
      };
      return;
    }

    const heuristic = tryCompileHeuristically(websiteUrl, step);
    if (heuristic) {
      heuristicHits++;
      out[i] = {
        ...step,
        compiledActions: heuristic,
        compileStatus: "compiled",
        compileVersion: COMPILE_VERSION,
        compileNotes:
          "Compiled without a model call using a deterministic heuristic.",
        fallbackPolicy: "llm_on_failure",
      };
      return;
    }

    needsModel.push({ index: i, type: step.type, description: step.description });
  });

  const batchResults = new Map<number, ExecutableAction[]>();
  let batchErrors = 0;
  const startedAt = Date.now();

  for (let i = 0; i < needsModel.length; i += BATCH_COMPILE_LIMIT) {
    const chunk = needsModel.slice(i, i + BATCH_COMPILE_LIMIT);
    try {
      const partial = await compileStepsBatched(websiteUrl, chunk);
      partial.forEach((actions, idx) => batchResults.set(idx, actions));
    } catch (error) {
      batchErrors++;
      console.error(
        `[compileStepBatch] batched call failed for chunk size ${chunk.length}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  const fallbackTargets = needsModel.filter((s) => !batchResults.has(s.index));
  const fallbackResults = await Promise.all(
    fallbackTargets.map(async (s) => ({
      index: s.index,
      compilation: await compileStepForExecution(websiteUrl, {
        type: s.type,
        description: s.description,
      }),
    }))
  );
  const fallbackMap = new Map(
    fallbackResults.map((r) => [r.index, r.compilation])
  );

  let batchedHits = 0;
  let fallbackHits = 0;
  for (const s of needsModel) {
    const step = rawSteps[s.index];
    const batched = batchResults.get(s.index);
    if (batched) {
      batchedHits++;
      out[s.index] = {
        ...step,
        compiledActions: batched,
        compileStatus: "compiled",
        compileVersion: COMPILE_VERSION,
        compileNotes: "Compiled in a batched model call.",
        fallbackPolicy: "llm_on_failure",
      };
      continue;
    }

    fallbackHits++;
    const fallback = fallbackMap.get(s.index);
    out[s.index] = {
      ...step,
      compiledActions: fallback?.compiledActions,
      compileStatus: fallback?.compileStatus ?? "pending",
      compileVersion: COMPILE_VERSION,
      compileNotes: fallback?.compileNotes
        ? `Per-step fallback after batch miss: ${fallback.compileNotes}`
        : "Per-step fallback after batch miss.",
      fallbackPolicy: "llm_on_failure",
    };
  }

  console.error(
    `[compileStepBatch] total=${rawSteps.length} heuristic=${heuristicHits} batched=${batchedHits} fallback=${fallbackHits} batchErrors=${batchErrors} ms=${
      Date.now() - startedAt
    }`
  );

  return out;
}

async function compileGeneratedSteps(
  websiteUrl: string,
  steps: ReadonlyArray<{ type: "act" | "assert" | "auth"; description: string }>
): Promise<CompiledStep[]> {
  return compileStepBatch(websiteUrl, steps);
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
