import { writeFile } from "node:fs/promises";
import type { Page } from "playwright-core";
import { chromium as remoteChromium } from "playwright-core";
import { v4 as uuidv4 } from "uuid";

import { COMPILE_VERSION, compileStepForExecution } from "@/lib/ai/generate-steps";
import {
  createBrowserSession,
  stopBrowserSession,
} from "@/lib/browserbase/session";
import {
  executeActions,
  shouldUseFallback,
  translateStepWithFallback,
  type ActionProgress,
  type ExecutableAction,
} from "@/lib/execution/step-executor";
import {
  ERROR_REPORT_VERSION,
  serializeErrorReport,
  truncateStack,
  type StructuredErrorReport,
} from "@/lib/execution/error-report";
import {
  analyzeStepFailure,
  buildFallbackAnalysis,
  type AnalyzeFailureContext,
  type FailingActionSummary,
} from "@/lib/ai/analyze-failure";
import type { TestStep } from "@/lib/supabase/types";

import { getStepScreenshotPath } from "./paths.js";
import {
  getProject,
  getRun,
  getTest,
  insertRun,
  updateRun,
  updateRunStep,
  updateTestSteps,
} from "./store.js";
import type { LocalRun, LocalRunStep } from "./types.js";

const FAILURE_ANALYSIS_TIMEOUT_MS = 15_000;
const KEEP_ALIVE_MS = 2_500;

interface RunnerOptions {
  /** Total cap on the run, defaults to 5 minutes (matches the web app). */
  timeoutMs?: number;
}

interface RunnerResult {
  runId: string;
  status: "passed" | "failed";
  steps: LocalRunStep[];
  failure?: StructuredErrorReport;
  liveViewUrl?: string;
  sessionReplayUrl?: string;
  screenshotPaths: string[];
}

async function runAnalysisWithTimeout(
  ctx: AnalyzeFailureContext
): Promise<StructuredErrorReport> {
  const rawForReport = ctx.completedActions.length
    ? `${ctx.rawErrorMessage}\n\nCompleted before failure:\n- ${ctx.completedActions.join(
        "\n- "
      )}`
    : ctx.rawErrorMessage;

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<"__timeout__">((resolve) => {
    timeoutHandle = setTimeout(() => resolve("__timeout__"), FAILURE_ANALYSIS_TIMEOUT_MS);
  });

  try {
    const outcome = await Promise.race([analyzeStepFailure(ctx), timeoutPromise]);
    if (outcome === "__timeout__") {
      const fallback = buildFallbackAnalysis(ctx, "timeout");
      return { version: ERROR_REPORT_VERSION, ...fallback, raw: rawForReport };
    }
    return { version: ERROR_REPORT_VERSION, ...outcome, raw: rawForReport };
  } catch {
    const fallback = buildFallbackAnalysis(ctx, "error");
    return { version: ERROR_REPORT_VERSION, ...fallback, raw: rawForReport };
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

async function capturePageState(
  page: Page
): Promise<{ url: string; title: string }> {
  let url = "";
  let title = "";
  try {
    url = page.url();
  } catch {
    /* ignore */
  }
  try {
    title = await page.title();
  } catch {
    /* ignore */
  }
  return { url, title };
}

function toFailingActionSummary(
  action: ExecutableAction | null | undefined
): FailingActionSummary | null {
  if (!action) return null;
  return {
    description: action.description,
    action: action.action,
    selector: action.selector,
    value: action.value,
    url: action.url,
  };
}

interface NonAuthStepResult {
  success: boolean;
  metadata: {
    mode: "compiled" | "fallback";
    fallbackUsed: boolean;
    completed: string[];
    failure?: string;
  };
  failingAction?: ExecutableAction;
  rawErrorMessage?: string;
}

async function runNonAuthStep(
  page: Page,
  step: TestStep,
  progress: ActionProgress
): Promise<NonAuthStepResult> {
  if (!step.compiledActions?.length) {
    const fallbackActions = await translateStepWithFallback(page, step);
    const fallbackResult = await executeActions(page, fallbackActions, progress);
    return {
      success: fallbackResult.success,
      metadata: {
        mode: "fallback",
        fallbackUsed: true,
        completed: fallbackResult.completedActions,
        failure: fallbackResult.success ? undefined : fallbackResult.details,
      },
      failingAction: fallbackResult.failingAction,
      rawErrorMessage: fallbackResult.rawErrorMessage,
    };
  }

  const compiledResult = await executeActions(
    page,
    step.compiledActions ?? [],
    progress
  );

  if (
    compiledResult.success ||
    !shouldUseFallback(step, compiledResult.details, Boolean(step.compiledActions?.length))
  ) {
    return {
      success: compiledResult.success,
      metadata: {
        mode: "compiled",
        fallbackUsed: false,
        completed: compiledResult.completedActions,
        failure: compiledResult.success ? undefined : compiledResult.details,
      },
      failingAction: compiledResult.failingAction,
      rawErrorMessage: compiledResult.rawErrorMessage,
    };
  }

  const fallbackActions = await translateStepWithFallback(page, step);
  const fallbackResult = await executeActions(page, fallbackActions, progress);
  return {
    success: fallbackResult.success,
    metadata: {
      mode: "fallback",
      fallbackUsed: true,
      completed: fallbackResult.completedActions,
      failure: fallbackResult.success ? undefined : fallbackResult.details,
    },
    failingAction: fallbackResult.failingAction,
    rawErrorMessage: fallbackResult.rawErrorMessage,
  };
}

async function ensureCompiledStep(
  testId: string,
  steps: TestStep[],
  index: number,
  websiteUrl: string
): Promise<TestStep> {
  const step = steps[index];

  if (step.type === "auth") return step;
  if (step.compiledActions?.length) return step;

  const compilation = await compileStepForExecution(websiteUrl, step);
  const updated: TestStep = {
    ...step,
    compiledActions: compilation.compiledActions,
    compileStatus: compilation.compileStatus ?? "pending",
    compileVersion: COMPILE_VERSION,
    compileNotes: compilation.compileNotes,
    fallbackPolicy: step.fallbackPolicy ?? "llm_on_failure",
  };
  steps[index] = updated;
  await updateTestSteps(testId, steps);
  return updated;
}

async function captureScreenshot(
  page: Page,
  runId: string,
  stepIndex: number
): Promise<string | undefined> {
  try {
    const buffer = await page.screenshot();
    const path = getStepScreenshotPath(runId, stepIndex);
    await writeFile(path, Buffer.from(buffer));
    return path;
  } catch {
    return undefined;
  }
}

function checkRequiredEnv(): string | null {
  const missing: string[] = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push("ANTHROPIC_API_KEY");
  if (!process.env.BROWSERBASE_API_KEY) missing.push("BROWSERBASE_API_KEY");
  if (!process.env.BROWSERBASE_PROJECT_ID) missing.push("BROWSERBASE_PROJECT_ID");
  return missing.length ? `Missing required environment variables: ${missing.join(", ")}` : null;
}

export async function executeRun(
  testId: string,
  options: RunnerOptions = {}
): Promise<RunnerResult> {
  const envError = checkRequiredEnv();
  if (envError) throw new Error(envError);

  const test = await getTest(testId);
  if (!test) throw new Error(`Test not found: ${testId}`);
  const project = await getProject(test.projectId);
  if (!project) throw new Error(`Project not found: ${test.projectId}`);
  if (project.executionMode === "local") {
    throw new Error(
      "Local execution is not supported by the MCP server. Use a public URL or run the Next.js web app for localhost testing."
    );
  }

  const runId = uuidv4();
  const startedAt = new Date().toISOString();
  const initialSteps: LocalRunStep[] = test.steps.map((_, idx) => ({
    stepIndex: idx,
    status: "pending",
  }));
  const run: LocalRun = {
    id: runId,
    testId,
    status: "running",
    startedAt,
    steps: initialSteps,
  };
  await insertRun(run);

  const screenshotPaths: string[] = [];
  let liveViewUrl: string | undefined;
  let sessionReplayUrl: string | undefined;
  let session:
    | {
        sessionId: string;
        connectUrl: string;
        liveViewUrl?: string;
        sessionReplayUrl?: string;
      }
    | undefined;
  let browser: Awaited<ReturnType<typeof remoteChromium.connectOverCDP>> | undefined;
  let allPassed = true;
  let failureReport: StructuredErrorReport | undefined;

  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  let timedOut = false;
  const timeoutHandle = setTimeout(() => {
    timedOut = true;
  }, timeoutMs);

  try {
    session = await createBrowserSession();
    liveViewUrl = session.liveViewUrl;
    sessionReplayUrl = session.sessionReplayUrl;
    if (liveViewUrl || sessionReplayUrl) {
      await updateRun(runId, { liveViewUrl, sessionReplayUrl });
    }

    browser = await remoteChromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    // Mutable steps array we may patch with newly-compiled actions.
    const stepsBuffer: TestStep[] = [...test.steps];

    for (let i = 0; i < stepsBuffer.length; i++) {
      if (timedOut) {
        await updateRunStep(runId, i, {
          status: "failed",
          details: "Run exceeded time budget.",
          completedAt: new Date().toISOString(),
        });
        allPassed = false;
        for (let j = i + 1; j < stepsBuffer.length; j++) {
          await updateRunStep(runId, j, { status: "skipped" });
        }
        break;
      }

      const step = await ensureCompiledStep(testId, stepsBuffer, i, project.url);
      await updateRunStep(runId, i, {
        status: "running",
        startedAt: new Date().toISOString(),
      });

      const progress: ActionProgress = { lastAttempted: null, completed: [] };

      try {
        if (step.type === "auth") {
          // Auth step support is intentionally out of scope for the MCP MVP.
          const message =
            "This test contains an `auth` step, which the MCP server does not support yet. Use the Next.js dashboard to configure and run auth-gated tests.";
          await updateRunStep(runId, i, {
            status: "failed",
            details: message,
            completedAt: new Date().toISOString(),
          });
          allPassed = false;
          for (let j = i + 1; j < stepsBuffer.length; j++) {
            await updateRunStep(runId, j, { status: "skipped" });
          }
          failureReport = {
            version: ERROR_REPORT_VERSION,
            repro: ["This MVP cannot drive auth flows."],
            cause: "Auth step encountered. The MCP server runs without credential storage.",
            fix: "Run this test from the Next.js dashboard, or remove the auth step from the workflow.",
            raw: message,
          };
          break;
        }

        const result = await runNonAuthStep(page, step, progress);
        const screenshotPath = await captureScreenshot(page, runId, i);
        if (screenshotPath) screenshotPaths.push(screenshotPath);

        if (result.success) {
          await updateRunStep(runId, i, {
            status: "passed",
            details: JSON.stringify(
              {
                mode: result.metadata.mode,
                fallbackUsed: result.metadata.fallbackUsed,
                completed: result.metadata.completed,
              },
              null,
              2
            ),
            screenshotPath,
            completedAt: new Date().toISOString(),
          });
          continue;
        }

        // Non-success path: build structured failure report.
        const pageState = await capturePageState(page);
        const failingActionSummary = toFailingActionSummary(result.failingAction);
        const rawErrorMessage =
          result.rawErrorMessage ??
          result.metadata.failure ??
          "Step failed without an error message";

        const ctx: AnalyzeFailureContext = {
          projectUrl: project.url,
          testName: test.name,
          testDescription: test.description,
          steps: stepsBuffer,
          failingStepIndex: i,
          completedActions: result.metadata.completed,
          failingAction: failingActionSummary,
          pageUrl: pageState.url,
          pageTitle: pageState.title,
          rawErrorMessage,
        };
        failureReport = await runAnalysisWithTimeout(ctx);
        await updateRunStep(runId, i, {
          status: "failed",
          details: serializeErrorReport(failureReport),
          screenshotPath,
          completedAt: new Date().toISOString(),
        });
        allPassed = false;
        for (let j = i + 1; j < stepsBuffer.length; j++) {
          await updateRunStep(runId, j, { status: "skipped" });
        }
        break;
      } catch (error) {
        // Unexpected throw — escaped the executor (e.g. internal JS bug,
        // Playwright connection drop). Build a structured report with
        // errorClass/stack annotations.
        allPassed = false;
        const errObj = error instanceof Error ? error : null;
        const message =
          errObj?.message ??
          (typeof error === "string" ? error : "Unknown step execution error");
        const errorClass = errObj?.name ?? "Error";
        const stack = truncateStack(errObj?.stack);

        const screenshotPath = await captureScreenshot(page, runId, i);
        if (screenshotPath) screenshotPaths.push(screenshotPath);

        const pageState = await capturePageState(page);
        const ctx: AnalyzeFailureContext = {
          projectUrl: project.url,
          testName: test.name,
          testDescription: test.description,
          steps: stepsBuffer,
          failingStepIndex: i,
          completedActions: progress.completed,
          failingAction: toFailingActionSummary(progress.lastAttempted),
          pageUrl: pageState.url,
          pageTitle: pageState.title,
          rawErrorMessage: `${errorClass}: ${message}`,
        };
        const baseReport = await runAnalysisWithTimeout(ctx);
        failureReport = { ...baseReport, errorClass, stack };

        await updateRunStep(runId, i, {
          status: "failed",
          details: serializeErrorReport(failureReport),
          screenshotPath,
          completedAt: new Date().toISOString(),
        });
        for (let j = i + 1; j < stepsBuffer.length; j++) {
          await updateRunStep(runId, j, { status: "skipped" });
        }
        break;
      }
    }
  } finally {
    clearTimeout(timeoutHandle);

    // Brief grace period so the user can view the final state in the live view.
    if (session?.sessionId) {
      await new Promise((r) => setTimeout(r, KEEP_ALIVE_MS));
    }

    if (browser) {
      try {
        await browser.close();
      } catch {
        try {
          // Some Playwright versions expose disconnect() instead.
          await (browser as unknown as { disconnect?: () => Promise<void> }).disconnect?.();
        } catch {
          /* ignore */
        }
      }
    }
    if (session?.sessionId) {
      await stopBrowserSession(session.sessionId);
    }
  }

  const finalStatus: "passed" | "failed" = allPassed ? "passed" : "failed";
  await updateRun(runId, {
    status: finalStatus,
    completedAt: new Date().toISOString(),
    failure: failureReport,
  });

  // Read back the run so we return the final persisted step states.
  const persisted = await getRun(runId);
  const steps = persisted?.steps ?? initialSteps;

  return {
    runId,
    status: finalStatus,
    steps,
    failure: failureReport,
    liveViewUrl,
    sessionReplayUrl,
    screenshotPaths,
  };
}
