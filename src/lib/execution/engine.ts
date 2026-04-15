import { chromium } from "playwright-core";
import { supabase } from "@/lib/supabase/client";
import { Test } from "@/lib/supabase/types";
import { createBrowserSession } from "@/lib/browserbase/session";
import { translateStep, executeActions } from "./step-executor";
import { uploadScreenshot } from "./screenshot";
import { runEventBus } from "./event-bus";

export async function executeTestRun(runId: string, test: Test) {
  // Update run status to running
  await supabase
    .from("test_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", runId);

  runEventBus.emit(runId, { type: "run", runStatus: "running" });

  let browser;
  try {
    // Create Browserbase session
    const session = await createBrowserSession();

    runEventBus.emit(runId, {
      type: "run",
      runStatus: "running",
      liveViewUrl: session.liveViewUrl,
    });

    // Connect via CDP
    browser = await chromium.connectOverCDP(session.connectUrl);
    const context = browser.contexts()[0];
    const page = context.pages()[0] || (await context.newPage());

    let allPassed = true;

    for (let i = 0; i < test.steps.length; i++) {
      const step = test.steps[i];

      // Update step status to running
      await supabase
        .from("test_run_steps")
        .update({ status: "running", started_at: new Date().toISOString() })
        .eq("test_run_id", runId)
        .eq("step_index", i);

      runEventBus.emit(runId, {
        type: "step",
        stepUpdate: { stepIndex: i, status: "running" },
      });

      try {
        // Get page context for AI
        const pageUrl = page.url();
        const pageTitle = await page.title();
        let pageContent = "";
        try {
          pageContent = await page.evaluate(() => document.body.innerText);
        } catch {
          pageContent = "";
        }

        // Translate step to actions using AI
        const actions = await translateStep(step, pageUrl, pageTitle, pageContent);

        // Execute the actions
        const result = await executeActions(page, actions);

        // Take screenshot
        const screenshotBuffer = await page.screenshot();
        const screenshotUrl = await uploadScreenshot(
          runId,
          i,
          Buffer.from(screenshotBuffer)
        );

        const status = result.success ? "passed" : "failed";

        // Update step in DB
        await supabase
          .from("test_run_steps")
          .update({
            status,
            screenshot_url: screenshotUrl,
            details: result.details,
            completed_at: new Date().toISOString(),
          })
          .eq("test_run_id", runId)
          .eq("step_index", i);

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
          // Mark remaining steps as skipped
          for (let j = i + 1; j < test.steps.length; j++) {
            await supabase
              .from("test_run_steps")
              .update({ status: "skipped" })
              .eq("test_run_id", runId)
              .eq("step_index", j);

            runEventBus.emit(runId, {
              type: "step",
              stepUpdate: { stepIndex: j, status: "skipped" },
            });
          }
          break;
        }
      } catch (err: any) {
        allPassed = false;
        console.error(`Step ${i} error:`, err);

        await supabase
          .from("test_run_steps")
          .update({
            status: "failed",
            details: err.message,
            completed_at: new Date().toISOString(),
          })
          .eq("test_run_id", runId)
          .eq("step_index", i);

        runEventBus.emit(runId, {
          type: "step",
          stepUpdate: {
            stepIndex: i,
            status: "failed",
            details: err.message,
          },
        });

        // Mark remaining as skipped
        for (let j = i + 1; j < test.steps.length; j++) {
          await supabase
            .from("test_run_steps")
            .update({ status: "skipped" })
            .eq("test_run_id", runId)
            .eq("step_index", j);

          runEventBus.emit(runId, {
            type: "step",
            stepUpdate: { stepIndex: j, status: "skipped" },
          });
        }
        break;
      }
    }

    // Update final run status
    const finalStatus = allPassed ? "passed" : "failed";
    await supabase
      .from("test_runs")
      .update({ status: finalStatus, completed_at: new Date().toISOString() })
      .eq("id", runId);

    runEventBus.emit(runId, { type: "run", runStatus: finalStatus });
  } catch (err: any) {
    console.error("Test run error:", err);
    await supabase
      .from("test_runs")
      .update({
        status: "failed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", runId);

    runEventBus.emit(runId, { type: "run", runStatus: "failed" });
  } finally {
    // Disconnect Playwright but don't kill the Browserbase session
    // so the live view stays open for the user to inspect the final state.
    // The session will auto-expire via Browserbase's timeout.
    if (browser) {
      try {
        browser.disconnect();
      } catch {}
    }
  }
}
