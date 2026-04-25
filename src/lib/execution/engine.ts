import { chromium as localChromium } from "playwright";
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
      const status = result.success ? "passed" : "failed";

      await setStepStatus(runId, i, {
        status,
        screenshot_url: screenshotUrl,
        details: result.details,
        completed_at: new Date().toISOString(),
      });

      runEventBus.emit(runId, {
        type: "step",
        stepUpdate: {
          stepIndex: i,
          status,
          screenshotUrl: screenshotUrl || undefined,
          details: result.details,
        },
      });

      if (!result.success) {
        allPassed = false;
        await skipRemainingSteps(runId, i + 1, test.steps.length);
        break;
      }
    } catch (error) {
      allPassed = false;
      const message =
        error instanceof Error ? error.message : "Unknown step execution error";

      console.error(`Step ${i} error:`, error);

      await setStepStatus(runId, i, {
        status: "failed",
        details: message,
        completed_at: new Date().toISOString(),
      });

      runEventBus.emit(runId, {
        type: "step",
        stepUpdate: {
          stepIndex: i,
          status: "failed",
          details: message,
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
