import type { Page } from "playwright-core";
import { chromium as remoteChromium } from "playwright-core";
import { supabase } from "@/lib/supabase/client";
import { Test } from "@/lib/supabase/types";
import { createBrowserSession } from "@/lib/browserbase/session";
import {
  isLocalExecutionEnabled,
  type ProjectExecutionMode,
} from "@/lib/projects/url";
import { translateStep, executeActions } from "./step-executor";
import { uploadScreenshot } from "./screenshot";
import { runEventBus } from "./event-bus";
import {
  ERROR_REPORT_VERSION,
  serializeErrorReport,
  type StructuredErrorReport,
} from "./error-report";
import {
  analyzeStepFailure,
  buildFallbackAnalysis,
  type AnalyzeFailureContext,
  type FailingActionSummary,
} from "@/lib/ai/analyze-failure";

const FAILURE_ANALYSIS_TIMEOUT_MS = 15_000;

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
      console.warn("Failure analysis timed out; using deterministic fallback.");
      const fallback = buildFallbackAnalysis(ctx, "timeout");
      return { version: ERROR_REPORT_VERSION, ...fallback, raw: rawForReport };
    }
    return { version: ERROR_REPORT_VERSION, ...outcome, raw: rawForReport };
  } catch (err) {
    console.error("Failure analysis errored; using deterministic fallback:", err);
    const fallback = buildFallbackAnalysis(ctx, "error");
    return { version: ERROR_REPORT_VERSION, ...fallback, raw: rawForReport };
  } finally {
    if (timeoutHandle) clearTimeout(timeoutHandle);
  }
}

type BrowserLike = {
  close?: () => Promise<void>;
  disconnect?: () => Promise<void>;
  contexts: () => Array<{
    pages: () => Array<{
      url: () => string;
      title: () => Promise<string>;
      evaluate: <T>(fn: () => T) => Promise<T>;
      screenshot: () => Promise<Buffer>;
    }>;
    newPage: () => Promise<Page>;
  }>;
};

type ExecutableTest = Test & {
  url?: string;
  executionMode?: ProjectExecutionMode;
};

interface ExecutionRuntime {
  browser: BrowserLike;
  page: Page;
  liveViewUrl?: string;
}

async function setRunStatus(
  runId: string,
  status: "running" | "passed" | "failed"
) {
  await supabase
    .from("test_runs")
    .update({
      status,
      ...(status === "running"
        ? { started_at: new Date().toISOString() }
        : { completed_at: new Date().toISOString() }),
    })
    .eq("id", runId);
}

async function setStepStatus(
  runId: string,
  stepIndex: number,
  update: {
    status: "running" | "passed" | "failed" | "skipped";
    screenshot_url?: string | null;
    details?: string;
    started_at?: string;
    completed_at?: string;
  }
) {
  await supabase
    .from("test_run_steps")
    .update(update)
    .eq("test_run_id", runId)
    .eq("step_index", stepIndex);
}

async function skipRemainingSteps(runId: string, startIndex: number, total: number) {
  for (let stepIndex = startIndex; stepIndex < total; stepIndex++) {
    await setStepStatus(runId, stepIndex, { status: "skipped" });
    runEventBus.emit(runId, {
      type: "step",
      stepUpdate: { stepIndex, status: "skipped" },
    });
  }
}

async function failRunBeforeExecution(
  runId: string,
  test: ExecutableTest,
  message: string
) {
  console.error("Test run error:", message);

  if (test.steps.length > 0) {
    await setStepStatus(runId, 0, {
      status: "failed",
      details: message,
      completed_at: new Date().toISOString(),
    });

    runEventBus.emit(runId, {
      type: "step",
      stepUpdate: {
        stepIndex: 0,
        status: "failed",
        details: message,
      },
    });

    await skipRemainingSteps(runId, 1, test.steps.length);
  }

  await setRunStatus(runId, "failed");
  runEventBus.emit(runId, { type: "run", runStatus: "failed" });
}

async function executeSteps(runId: string, test: ExecutableTest, page: Page) {
  let allPassed = true;

  for (let i = 0; i < test.steps.length; i++) {
    const step = test.steps[i];

    await setStepStatus(runId, i, {
      status: "running",
      started_at: new Date().toISOString(),
    });

    runEventBus.emit(runId, {
      type: "step",
      stepUpdate: { stepIndex: i, status: "running" },
    });

    try {
      const pageUrl = page.url();
      const pageTitle = await page.title();
      let pageContent = "";
      try {
        pageContent = await page.evaluate(() => document.body.innerText);
      } catch {
        pageContent = "";
      }

      const actions = await translateStep(step, pageUrl, pageTitle, pageContent);
      const result = await executeActions(page, actions);
      const screenshotBuffer = await page.screenshot();
      const screenshotUrl = await uploadScreenshot(
        runId,
        i,
        Buffer.from(screenshotBuffer)
      );

      if (result.success) {
        await setStepStatus(runId, i, {
          status: "passed",
          screenshot_url: screenshotUrl,
          details: result.details,
          completed_at: new Date().toISOString(),
        });

        runEventBus.emit(runId, {
          type: "step",
          stepUpdate: {
            stepIndex: i,
            status: "passed",
            screenshotUrl: screenshotUrl || undefined,
            details: result.details,
          },
        });
      } else {
        const failingActionSummary: FailingActionSummary = {
          description: result.failingAction.description,
          action: result.failingAction.action,
          selector: result.failingAction.selector,
          value: result.failingAction.value,
          url: result.failingAction.url,
        };

        const pageUrlAtFailure = (() => {
          try {
            return page.url();
          } catch {
            return pageUrl;
          }
        })();
        const pageTitleAtFailure = await (async () => {
          try {
            return await page.title();
          } catch {
            return pageTitle;
          }
        })();

        const report = await runAnalysisWithTimeout({
          projectUrl: test.url ?? "",
          testName: test.name,
          testDescription: test.description,
          steps: test.steps,
          failingStepIndex: i,
          completedActions: result.completedActions,
          failingAction: failingActionSummary,
          pageUrl: pageUrlAtFailure,
          pageTitle: pageTitleAtFailure,
          rawErrorMessage: result.rawErrorMessage,
        });

        const serialized = serializeErrorReport(report);

        await setStepStatus(runId, i, {
          status: "failed",
          screenshot_url: screenshotUrl,
          details: serialized,
          completed_at: new Date().toISOString(),
        });

        runEventBus.emit(runId, {
          type: "step",
          stepUpdate: {
            stepIndex: i,
            status: "failed",
            screenshotUrl: screenshotUrl || undefined,
            details: serialized,
          },
        });

        allPassed = false;
        await skipRemainingSteps(runId, i + 1, test.steps.length);
        break;
      }
    } catch (error) {
      allPassed = false;
      const message =
        error instanceof Error ? error.message : "Unknown step execution error";

      console.error(`Step ${i} error:`, error);

      let screenshotUrl: string | null = null;
      try {
        const screenshotBuffer = await page.screenshot();
        screenshotUrl = await uploadScreenshot(
          runId,
          i,
          Buffer.from(screenshotBuffer)
        );
      } catch {
        // Page may be in a broken state; skip screenshot silently.
      }

      let pageUrlAtFailure = "";
      let pageTitleAtFailure = "";
      try {
        pageUrlAtFailure = page.url();
      } catch {}
      try {
        pageTitleAtFailure = await page.title();
      } catch {}

      const fallbackCtx: AnalyzeFailureContext = {
        projectUrl: test.url ?? "",
        testName: test.name,
        testDescription: test.description,
        steps: test.steps,
        failingStepIndex: i,
        completedActions: [],
        failingAction: null,
        pageUrl: pageUrlAtFailure,
        pageTitle: pageTitleAtFailure,
        rawErrorMessage: message,
      };
      const fallback = buildFallbackAnalysis(fallbackCtx, "internal");
      const report: StructuredErrorReport = {
        version: ERROR_REPORT_VERSION,
        ...fallback,
        raw: message,
      };
      const serialized = serializeErrorReport(report);

      await setStepStatus(runId, i, {
        status: "failed",
        screenshot_url: screenshotUrl,
        details: serialized,
        completed_at: new Date().toISOString(),
      });

      runEventBus.emit(runId, {
        type: "step",
        stepUpdate: {
          stepIndex: i,
          status: "failed",
          screenshotUrl: screenshotUrl || undefined,
          details: serialized,
        },
      });

      await skipRemainingSteps(runId, i + 1, test.steps.length);
      break;
    }
  }

  const finalStatus = allPassed ? "passed" : "failed";
  await setRunStatus(runId, finalStatus);
  runEventBus.emit(runId, { type: "run", runStatus: finalStatus });
}

async function createLocalBrowser(): Promise<ExecutionRuntime> {
  let localChromium;
  try {
    // Lazy-load: the full `playwright` package is only needed for local
    // execution. Keeping this import static would break builds/runs for
    // users who only use Browserbase (remote) mode and haven't installed it.
    // `playwright` is in Next.js's auto-external list so it uses native
    // require at runtime (see serverExternalPackages docs).
    // @ts-expect-error -- optional peer dep; may not be installed
    ({ chromium: localChromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Local execution requires the `playwright` package. Install it with `npm install playwright` and run `npx playwright install chromium`, or switch this project to Browserbase mode."
    );
  }

  const browser = await localChromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  return { browser, page };
}

async function createRemoteBrowser(): Promise<ExecutionRuntime> {
  const session = await createBrowserSession();
  const browser = await remoteChromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());

  return { browser, page, liveViewUrl: session.liveViewUrl };
}

export async function executeTestRun(runId: string, test: ExecutableTest) {
  await setRunStatus(runId, "running");
  runEventBus.emit(runId, { type: "run", runStatus: "running" });

  const executionMode = test.executionMode ?? "browserbase";
  let browser: BrowserLike | undefined;
  try {
    if (!test.url) {
      throw new Error("Project URL missing for test execution");
    }

    if (executionMode === "local" && !isLocalExecutionEnabled()) {
      await failRunBeforeExecution(
        runId,
        test,
        "Local execution is disabled. Set LOCAL_EXECUTION_ENABLED=true and run the app locally to test localhost URLs."
      );
      return;
    }

    const runtime =
      executionMode === "local"
        ? await createLocalBrowser()
        : await createRemoteBrowser();

    browser = runtime.browser;

    if (runtime.liveViewUrl) {
      runEventBus.emit(runId, {
        type: "run",
        runStatus: "running",
        liveViewUrl: runtime.liveViewUrl,
      });
    }

    await executeSteps(runId, test, runtime.page);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown test execution error";
    await failRunBeforeExecution(runId, test, message);
  } finally {
    if (browser) {
      try {
        if (executionMode === "local" && browser.close) {
          await browser.close();
        } else if (browser.disconnect) {
          await browser.disconnect();
        }
      } catch {
        // Ignore browser teardown errors.
      }
    }
  }
}
