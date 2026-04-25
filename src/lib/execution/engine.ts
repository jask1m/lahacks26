import type { Page } from "playwright-core";
import { chromium as remoteChromium } from "playwright-core";
import {
  generateQaCredentials,
  persistGeneratedCredentials,
} from "@/lib/auth/storage";
import { supabase } from "@/lib/supabase/client";
import type { ResolvedAuthConfig } from "@/lib/auth/types";
import type { Test, TestStep } from "@/lib/supabase/types";
import { COMPILE_VERSION, compileStepForExecution } from "@/lib/ai/generate-steps";
import { createBrowserSession, stopBrowserSession } from "@/lib/browserbase/session";
import {
  isLocalExecutionEnabled,
  type ProjectExecutionMode,
} from "@/lib/projects/url";
import {
  executeActions,
  executeAuthStep,
  shouldUseFallback,
  translateStepWithFallback,
} from "./step-executor";
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
  resolvedAuthConfig?: ResolvedAuthConfig | null;
};

interface ExecutionRuntime {
  browser: BrowserLike;
  page: Page;
  liveViewUrl?: string;
}

interface StepExecutionMetadata {
  mode: "auth" | "compiled" | "fallback";
  fallbackUsed: boolean;
  compileStatus?: TestStep["compileStatus"];
  compileNotes?: string;
  completed: string[];
  failure?: string;
}

function formatStepDetails(metadata: StepExecutionMetadata) {
  return JSON.stringify(
    {
      summary:
        metadata.mode === "auth"
          ? metadata.failure ?? "Authenticated with the configured auth flow."
          : metadata.failure ??
            `Executed via ${metadata.fallbackUsed ? "fallback recovery" : metadata.mode}.`,
      mode: metadata.mode,
      fallbackUsed: metadata.fallbackUsed,
      compileStatus: metadata.compileStatus,
      compileNotes: metadata.compileNotes,
      completed: metadata.completed,
      failure: metadata.failure,
    },
    null,
    2
  );
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

async function persistCompiledStep(test: ExecutableTest) {
  await supabase.from("tests").update({ steps: test.steps }).eq("id", test.id);
}

async function ensureCompiledStep(test: ExecutableTest, stepIndex: number) {
  const step = test.steps[stepIndex];

  if (step.type === "auth") {
    return step;
  }

  if (step.compiledActions?.length) {
    return step;
  }

  if (!test.url) {
    return step;
  }

  const compilation = await compileStepForExecution(test.url, step);
  const updatedStep: TestStep = {
    ...step,
    compiledActions: compilation.compiledActions,
    compileStatus: compilation.compileStatus ?? "pending",
    compileVersion: COMPILE_VERSION,
    compileNotes: compilation.compileNotes,
    fallbackPolicy: step.fallbackPolicy ?? "llm_on_failure",
  };

  test.steps[stepIndex] = updatedStep;
  await persistCompiledStep(test);

  return updatedStep;
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

async function runNonAuthStep(page: Page, step: TestStep) {
  if (!step.compiledActions?.length) {
    const fallbackActions = await translateStepWithFallback(page, step);
    const fallbackResult = await executeActions(page, fallbackActions);

    return {
      success: fallbackResult.success,
      metadata: {
        mode: "fallback" as const,
        fallbackUsed: true,
        compileStatus: step.compileStatus,
        compileNotes:
          step.compileNotes ?? "Compilation was unavailable, so runtime fallback was used.",
        completed: fallbackResult.completedActions,
        failure: fallbackResult.success ? undefined : fallbackResult.details,
      },
    };
  }

  const compiledResult = await executeActions(page, step.compiledActions ?? []);

  if (
    compiledResult.success ||
    !shouldUseFallback(step, compiledResult.details, Boolean(step.compiledActions?.length))
  ) {
    return {
      success: compiledResult.success,
      metadata: {
        mode: "compiled" as const,
        fallbackUsed: false,
        compileStatus: step.compileStatus,
        compileNotes: step.compileNotes,
        completed: compiledResult.completedActions,
        failure: compiledResult.success ? undefined : compiledResult.details,
      },
    };
  }

  const fallbackActions = await translateStepWithFallback(page, step);
  const fallbackResult = await executeActions(page, fallbackActions);

  return {
    success: fallbackResult.success,
    metadata: {
      mode: "fallback" as const,
      fallbackUsed: true,
      compileStatus: step.compileStatus,
      compileNotes:
        step.compileNotes ?? "Runtime fallback used a compact page snapshot.",
      completed: fallbackResult.completedActions,
      failure: fallbackResult.success ? undefined : fallbackResult.details,
    },
  };
}

async function executeSteps(runId: string, test: ExecutableTest, page: Page) {
  let allPassed = true;

  for (let i = 0; i < test.steps.length; i++) {
    const step = await ensureCompiledStep(test, i);

    await setStepStatus(runId, i, {
      status: "running",
      started_at: new Date().toISOString(),
    });

    runEventBus.emit(runId, {
      type: "step",
      stepUpdate: { stepIndex: i, status: "running" },
    });

    try {
      const result =
        step.type === "auth"
          ? test.resolvedAuthConfig
            ? await (async () => {
                if (!test.url) {
                  return {
                    success: false,
                    metadata: {
                      mode: "auth" as const,
                      fallbackUsed: false,
                      completed: [],
                      failure: "Project URL missing for auth execution.",
                    },
                  };
                }

                const shouldGenerateCredentials =
                  test.resolvedAuthConfig!.config.strategy !== "existing_login";
                const hadStoredCredentials = Boolean(
                  test.resolvedAuthConfig!.credentials
                );
                const credentials =
                  shouldGenerateCredentials && !hadStoredCredentials
                    ? generateQaCredentials(test.url)
                    : test.resolvedAuthConfig!.credentials;

                if (!credentials) {
                  return {
                    success: false,
                    metadata: {
                      mode: "auth" as const,
                      fallbackUsed: false,
                      completed: [],
                      failure:
                        "This workflow auth strategy needs credentials, but none are configured.",
                    },
                  };
                }

                const authResult = await executeAuthStep(
                  page,
                  {
                    authConfig: test.resolvedAuthConfig!,
                    websiteUrl: test.url,
                    credentials,
                  }
                );

                if (
                  authResult.success &&
                  test.resolvedAuthConfig!.config.strategy ===
                    "create_then_remember" &&
                  !hadStoredCredentials
                ) {
                  await persistGeneratedCredentials(test.id, credentials);
                  test.resolvedAuthConfig = {
                    ...test.resolvedAuthConfig!,
                    credentials,
                    usernameHint: credentials.username,
                    credentialSource: "generated",
                  };
                }

                return {
                  success: authResult.success,
                  metadata: {
                    mode: "auth" as const,
                    fallbackUsed: false,
                    completed: authResult.completedActions,
                    failure: authResult.success ? undefined : authResult.details,
                  },
                };
              })()
            : {
                success: false,
                metadata: {
                  mode: "auth" as const,
                  fallbackUsed: false,
                  completed: [],
                  failure:
                    "This workflow includes an auth step, but no workflow auth config is available.",
                },
              }
          : await runNonAuthStep(page, step);

      const screenshotBuffer = await page.screenshot();
      const screenshotUrl = await uploadScreenshot(
        runId,
        i,
        Buffer.from(screenshotBuffer)
      );

      if (result.success) {
        const details = formatStepDetails(result.metadata);
        await setStepStatus(runId, i, {
          status: "passed",
          screenshot_url: screenshotUrl,
          details,
          completed_at: new Date().toISOString(),
        });

        runEventBus.emit(runId, {
          type: "step",
          stepUpdate: {
            stepIndex: i,
            status: "passed",
            screenshotUrl: screenshotUrl || undefined,
            details,
          },
        });
      } else {
        const details = formatStepDetails(result.metadata);

        await setStepStatus(runId, i, {
          status: "failed",
          screenshot_url: screenshotUrl,
          details,
          completed_at: new Date().toISOString(),
        });

        runEventBus.emit(runId, {
          type: "step",
          stepUpdate: {
            stepIndex: i,
            status: "failed",
            screenshotUrl: screenshotUrl || undefined,
            details,
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
    // Lazy-load so createLocalBrowser() doesn't run at import time for
    // users who only use Browserbase (remote) mode.
    ({ chromium: localChromium } = await import("playwright-core"));
  } catch {
    throw new Error(
      "Local execution requires browser binaries. Run `npx playwright install chromium`, or switch this project to Browserbase mode."
    );
  }

  const browser = await localChromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  return { browser, page };
}

async function createRemoteBrowser(): Promise<ExecutionRuntime & { sessionId: string }> {
  const session = await createBrowserSession();
  const browser = await remoteChromium.connectOverCDP(session.connectUrl);
  const context = browser.contexts()[0];
  const page = context.pages()[0] || (await context.newPage());

  return { browser, page, liveViewUrl: session.liveViewUrl, sessionId: session.sessionId };
}

export async function executeTestRun(runId: string, test: ExecutableTest) {
  await setRunStatus(runId, "running");
  runEventBus.emit(runId, { type: "run", runStatus: "running" });

  const executionMode = test.executionMode ?? "browserbase";
  let browser: BrowserLike | undefined;
  let remoteSessionId: string | undefined;
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
    if ("sessionId" in runtime) {
      remoteSessionId = runtime.sessionId;
    }

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
    // Keep the browser session alive briefly so the user can see the final state
    // in the live view before the connection drops.
    const KEEP_ALIVE_MS = 10_000;
    if (remoteSessionId) {
      await new Promise((r) => setTimeout(r, KEEP_ALIVE_MS));
    }

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
    if (remoteSessionId) {
      await stopBrowserSession(remoteSessionId);
    }
  }
}
