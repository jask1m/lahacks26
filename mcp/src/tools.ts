import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

import { generateTestSuite } from "@/lib/ai/generate-steps";
import { normalizeProjectUrl } from "@/lib/projects/url";
import type { TestStep } from "@/lib/supabase/types";

import {
  applyTestOverrides,
  findProjectByUrl,
  getTestsBySuite,
  insertProject,
  insertTest,
} from "./store.js";
import { executeRun } from "./runner.js";
import { formatRunReport, type RunReportPayload } from "./format.js";
import type { LocalProject, LocalTest } from "./types.js";

export interface ToolDefinition<Args, Result> {
  name: string;
  title: string;
  description: string;
  inputSchema: z.ZodType<Args>;
  handler: (args: Args) => Promise<Result>;
  /**
   * Optional pre-render of the result into a user-facing markdown string. When
   * provided, the server emits the formatted text as the first content block
   * (with a strict "print verbatim" directive) so MCP clients display the
   * spec'd format regardless of how the agent paraphrases.
   */
  format?: (result: Result) => string;
}

function projectSummary(project: LocalProject) {
  return {
    projectId: project.id,
    name: project.name,
    url: project.url,
    executionMode: project.executionMode,
    createdAt: project.createdAt,
  };
}

function testProposal(test: LocalTest) {
  return {
    testId: test.id,
    name: test.name,
    description: test.description,
    steps: test.steps,
  };
}

// ---- propose_tests ----

const testStepInputSchema: z.ZodType<TestStep> = z
  .object({
    id: z.string().min(1),
    type: z.enum(["act", "assert", "auth"]),
    description: z.string(),
  })
  // Allow forward-compatible fields (compiledActions, authConfig, etc.) without
  // having to re-declare every optional property here.
  .passthrough() as unknown as z.ZodType<TestStep>;

const proposeTestsSchema = z.object({
  url: z
    .string()
    .min(1)
    .describe("Public URL of the website to test (http/https; localhost is not supported)."),
  intent: z
    .string()
    .min(5)
    .describe(
      "High-level test intent in plain English, e.g. 'cover the login flow including invalid credentials and the forgot-password link'. The model will fan this out into several distinct tests."
    ),
  count: z
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe(
      "How many distinct tests to propose under this intent (1–5, default 3). Each test runs in its own browser session."
    ),
  name: z
    .string()
    .optional()
    .describe("Optional human-friendly project name. Defaults to the URL hostname."),
});

const proposeTests: ToolDefinition<z.infer<typeof proposeTestsSchema>, unknown> = {
  name: "propose_tests",
  title: "Propose a series of tests for user review",
  description:
    "Given a website URL and a high-level intent, propose a SUITE of distinct tests (default 3) covering different behaviors. Persists each as a draft test under a shared `suiteId`. After calling this tool, render the proposed `tests` array to the user as a readable summary (test names + step bullets) and ALWAYS include an explicit invitation that they can edit, e.g. \"Reply with any edits (rename, reword, change/add/remove steps) or I'll run it as-is.\" Then IMMEDIATELY call `run_tests` with the same `suiteId` — the host application's tool-approval prompt for `run_tests` is the user's single confirmation gate, so do NOT ask your own separate \"does this look good?\" / \"approve?\" yes/no question. If the user replies with edits before you call `run_tests`, encode them in the `tests` override array on that call.",
  inputSchema: proposeTestsSchema,
  handler: async ({ url, intent, count, name }) => {
    const normalized = normalizeProjectUrl(url, name);
    if (normalized.executionMode === "local") {
      throw new Error(
        "The MCP server cannot run tests against localhost. Use the Next.js dashboard for local URLs."
      );
    }

    let project = await findProjectByUrl(normalized.url);
    let projectReused = true;
    if (!project) {
      project = {
        id: uuidv4(),
        name: normalized.name,
        url: normalized.url,
        executionMode: normalized.executionMode,
        createdAt: new Date().toISOString(),
      };
      await insertProject(project);
      projectReused = false;
    }

    const requested = count ?? 3;
    const suiteId = uuidv4();
    const generated = await generateTestSuite(project.url, intent, requested);

    const persisted: LocalTest[] = [];
    // Sequential inserts so createdAt timestamps establish a deterministic
    // suite order even on fast machines.
    for (const gen of generated) {
      const stepsWithIds: TestStep[] = gen.steps.map((step) => ({
        id: uuidv4(),
        ...step,
      }));
      const test: LocalTest = {
        id: uuidv4(),
        projectId: project.id,
        suiteId,
        name: gen.name,
        description: gen.description,
        steps: stepsWithIds,
        createdAt: new Date().toISOString(),
      };
      await insertTest(test);
      persisted.push(test);
    }

    const authTests = persisted
      .filter((t) => t.steps.some((s) => s.type === "auth"))
      .map((t) => t.id);

    return {
      suiteId,
      projectId: project.id,
      projectUrl: project.url,
      projectReused,
      tests: persisted.map(testProposal),
      reviewInstructions:
        "Render this suite to the user as a concise summary (test names + step bullets). Include an explicit one-line invitation such as \"Reply with any edits (rename, reword, change/add/remove steps) or I'll run it as-is.\" so the user clearly knows editing is an option. Then call `run_tests` with this `suiteId` immediately — do NOT add your own \"does this look good?\" or \"approve?\" question, because the host application's tool-approval prompt on the `run_tests` call is the user's single confirmation gate. If the user interrupts with edits before you make that call, pass them via the `tests` override array on `run_tests`.",
      warnings: authTests.length
        ? [
            `Tests ${authTests.join(
              ", "
            )} contain an auth step. The MCP server cannot execute auth-gated tests in this MVP — those tests will fail gracefully when you call run_tests. Consider editing them out of the suite or using the Next.js dashboard.`,
          ]
        : [],
    };
  },
};

// ---- run_tests ----

const runTestsOverrideSchema = z.object({
  testId: z.string().min(1),
  name: z.string().optional(),
  description: z.string().optional(),
  steps: z
    .array(testStepInputSchema)
    .optional()
    .describe(
      "Full replacement steps array for this test. If omitted, the previously persisted steps are used."
    ),
});

const runTestsSchema = z.object({
  suiteId: z
    .string()
    .min(1)
    .describe("Suite identifier returned by `propose_tests`."),
  tests: z
    .array(runTestsOverrideSchema)
    .optional()
    .describe(
      "Optional per-test overrides reflecting user edits. Each entry's `testId` must belong to the suite. Provide only the tests the user changed; others run as proposed."
    ),
  timeoutMsPerTest: z
    .number()
    .int()
    .positive()
    .max(15 * 60_000)
    .optional()
    .describe("Optional cap per test in ms. Defaults to 5 minutes per test."),
});

const runTests: ToolDefinition<z.infer<typeof runTestsSchema>, RunReportPayload> = {
  name: "run_tests",
  title: "Run an approved test suite and return per-test results",
  description:
    "Execute every test in an approved suite, each in its own fresh isolated browser session. Blocks until all tests reach a terminal state. Only call this AFTER the user has approved the proposed suite.\n\n" +
    "USER-FACING OUTPUT: the response includes a pre-rendered USER-FACING REPORT in the first text content block, wrapped between `<<<REPORT>>>` and `<<<END>>>` markers. Reply to the user with the EXACT contents between those markers, verbatim, with no prefix, suffix, paraphrasing, or summary. Do not wrap the report in your own narrative or restate the test intent. The second text block is structured JSON for your internal reference only — do not surface it to the user, and never show `liveViewUrl`, screenshot paths, or stack traces. Always label the durable link as 'Recording' (it is a video).",
  inputSchema: runTestsSchema,
  handler: async ({ suiteId, tests, timeoutMsPerTest }) => {
    let suiteTests = await getTestsBySuite(suiteId);
    if (suiteTests.length === 0) {
      throw new Error(
        `No tests found for suiteId ${suiteId}. Call propose_tests first to create a suite.`
      );
    }

    if (tests && tests.length > 0) {
      suiteTests = await applyTestOverrides(
        suiteId,
        tests.map((t) => ({
          testId: t.testId,
          name: t.name,
          description: t.description,
          steps: t.steps,
        }))
      );
    }

    const results: Array<{
      testId: string;
      name: string;
      status: "passed" | "failed";
      recordingUrl?: string;
      liveViewUrl?: string;
      steps: unknown;
      screenshotPaths: string[];
      failure?: unknown;
    }> = [];

    let passed = 0;
    let failed = 0;

    for (const test of suiteTests) {
      const runResult = await executeRun(test.id, { timeoutMs: timeoutMsPerTest });
      const status: "passed" | "failed" = runResult.status;
      if (status === "passed") passed += 1;
      else failed += 1;

      results.push({
        testId: test.id,
        name: test.name,
        status,
        recordingUrl: runResult.sessionReplayUrl,
        liveViewUrl: runResult.liveViewUrl,
        steps: runResult.steps,
        screenshotPaths: runResult.screenshotPaths,
        failure: runResult.failure,
      });
    }

    return {
      suiteId,
      summary: {
        total: results.length,
        passed,
        failed,
      },
      results,
    };
  },
  format: formatRunReport,
};

export const allTools = [proposeTests, runTests] as const;
