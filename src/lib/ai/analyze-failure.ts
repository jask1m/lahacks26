import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { ANALYZE_FAILURE_SYSTEM_PROMPT } from "./prompts";
import { TestStep } from "@/lib/supabase/types";

const analysisSchema = z.object({
  repro: z.array(z.string()).min(1),
  cause: z.string(),
  fix: z.string(),
});

export type FailureAnalysis = z.infer<typeof analysisSchema>;

export interface FailingActionSummary {
  description: string;
  action: string;
  selector?: string;
  value?: string;
  url?: string;
}

export interface AnalyzeFailureContext {
  projectUrl: string;
  testName: string;
  testDescription: string;
  steps: TestStep[];
  failingStepIndex: number;
  completedActions: string[];
  failingAction: FailingActionSummary | null;
  pageUrl: string;
  pageTitle: string;
  rawErrorMessage: string;
}

function formatActionDetails(action: FailingActionSummary | null): string {
  if (!action) return "(no translated action — failure occurred before/around translation)";
  const parts: string[] = [action.action];
  if (action.selector) parts.push(`selector=${JSON.stringify(action.selector)}`);
  if (action.value) parts.push(`value=${JSON.stringify(action.value)}`);
  if (action.url) parts.push(`url=${JSON.stringify(action.url)}`);
  return `${action.description} (${parts.join(" ")})`;
}

function buildPrompt(ctx: AnalyzeFailureContext): string {
  const stepsList = ctx.steps
    .map(
      (s, i) =>
        `${i + 1}. [${s.type}] ${s.description}${
          i === ctx.failingStepIndex ? "   <-- FAILED" : ""
        }`
    )
    .join("\n");

  const completed =
    ctx.completedActions.length > 0
      ? ctx.completedActions.map((a) => `- ${a}`).join("\n")
      : "(none — failure occurred on the first action of this step)";

  const failingStep = ctx.steps[ctx.failingStepIndex];

  return `Project URL: ${ctx.projectUrl || "(unknown)"}
Test: ${ctx.testName} — ${ctx.testDescription}

All test steps:
${stepsList}

Failing step (#${ctx.failingStepIndex + 1}): [${failingStep?.type ?? "?"}] ${
    failingStep?.description ?? "(unknown)"
  }
Translated failing action: ${formatActionDetails(ctx.failingAction)}

Actions completed before failure (within this step and earlier steps of this run, in order):
${completed}

Page state at failure:
- URL: ${ctx.pageUrl || "(unknown)"}
- Title: ${ctx.pageTitle || "(unknown)"}

Raw error message:
${ctx.rawErrorMessage}

Produce the structured report as specified.`;
}

export async function analyzeStepFailure(
  ctx: AnalyzeFailureContext
): Promise<FailureAnalysis> {
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-20250514"),
    schema: analysisSchema,
    system: ANALYZE_FAILURE_SYSTEM_PROMPT,
    prompt: buildPrompt(ctx),
  });
  return object;
}

/**
 * Deterministic fallback used when the analyzer itself errors or times out.
 * Produces a best-effort repro list from the test steps themselves so the UI
 * still shows useful structured content.
 */
export function buildFallbackAnalysis(
  ctx: AnalyzeFailureContext,
  reason: "timeout" | "error" | "internal" = "error"
): FailureAnalysis {
  const prefix: string[] = [];
  if (ctx.projectUrl) {
    prefix.push(`Navigate to ${ctx.projectUrl}.`);
  }

  const stepRepro = ctx.steps
    .slice(0, ctx.failingStepIndex + 1)
    .map((s, i) => {
      const isFailing = i === ctx.failingStepIndex;
      const base = s.description.trim().replace(/\.$/, "");
      return isFailing
        ? `${base} — this is where the test failed.`
        : `${base}.`;
    });

  const repro = [...prefix, ...stepRepro];

  const causeByReason: Record<typeof reason, string> = {
    timeout:
      `Automatic analysis timed out. Raw error: ${ctx.rawErrorMessage}`,
    error:
      `Automatic analysis was unavailable. Raw error: ${ctx.rawErrorMessage}`,
    internal:
      `An internal error occurred while running this step. Raw error: ${ctx.rawErrorMessage}`,
  };

  return {
    repro,
    cause: causeByReason[reason],
    fix: "Inspect the failing step and the captured screenshot to determine whether the test expectation or the website behaviour needs to change.",
  };
}
