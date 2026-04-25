"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Test } from "@/lib/supabase/types";
import { useRunStream } from "@/hooks/use-run-stream";
import { RunnerLayout } from "@/components/runner/runner-layout";
import { StepProgress } from "@/components/runner/step-progress";
import { BrowserEmbed } from "@/components/runner/browser-embed";
import {
  getAuthStrategyLabel,
  maskWorkflowUsername,
  resolveWorkflowAuthConfigFromStep,
} from "@/lib/auth/workflow";
import {
  getProjectExecutionModeFromString,
  type ProjectExecutionMode,
} from "@/lib/projects/url";
import { KeyRound, RotateCcw, Pencil, Square } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/dashboard/topbar";

export default function TestRunPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const testId = params.testId as string;
  const runId = params.runId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [rerunning, setRerunning] = useState(false);
  const [executionMode, setExecutionMode] =
    useState<ProjectExecutionMode>("browserbase");
  const [projectUrl, setProjectUrl] = useState<string | null>(null);
  const { steps: runSteps, runStatus, liveViewUrl } = useRunStream(runId);

  useEffect(() => {
    async function loadTest() {
      const [{ data: testData }, { data: projectData }] = await Promise.all([
        supabase.from("tests").select("*").eq("id", testId).single(),
        supabase
          .from("projects")
          .select("execution_mode, url")
          .eq("id", projectId)
          .single(),
      ]);

      setTest(testData);
      setProjectUrl(projectData?.url ?? null);
      setExecutionMode(
        projectData?.execution_mode ??
          getProjectExecutionModeFromString(
            projectData?.url ?? "https://example.com"
          )
      );
    }
    loadTest();
  }, [projectId, testId]);

  // Compute step counts
  const { passedCount, failedCount, pendingCount, completedCount, totalSteps } = useMemo(() => {
    const total = test?.steps.length ?? 0;
    let passed = 0, failed = 0;
    for (const rs of runSteps) {
      if (rs.status === "passed") passed++;
      else if (rs.status === "failed") failed++;
    }
    return {
      passedCount: passed,
      failedCount: failed,
      pendingCount: total - passed - failed,
      completedCount: passed + failed,
      totalSteps: total,
    };
  }, [runSteps, test?.steps.length]);

  if (!test) return <div className="p-7 text-muted-foreground">Loading...</div>;

  const authStep = test.steps.find((step) => step.type === "auth") ?? null;
  const resolvedAuthConfig = resolveWorkflowAuthConfigFromStep(authStep);
  const isDefaultedAuth = Boolean(authStep && !authStep.authConfig);
  const maskedUsername = authStep?.authCredentials?.username
    ? maskWorkflowUsername(authStep.authCredentials.username)
    : null;

  const progressPct = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;
  const latestScreenshotUrl =
    [...runSteps].reverse().find((step) => step.screenshot_url)?.screenshot_url ??
    null;

  // Status chip + indicator styling
  const chipStyles: Record<string, string> = {
    pending: "bg-bg-3 text-text-tertiary border-border-highlight",
    running: "bg-accent-blue/12 text-accent-blue border-accent-blue/28",
    passed: "bg-accent-green/12 text-accent-green border-accent-green/28",
    failed: "bg-destructive/12 text-destructive border-destructive/28",
  };

  const indicatorStyles: Record<string, string> = {
    pending: "bg-bg-3 border border-border-highlight",
    running: "bg-accent-blue shadow-[0_0_0_3px_oklch(0.68_0.18_255/0.12)] animate-ta-pulse",
    passed: "bg-accent-green shadow-[0_0_6px_oklch(0.7_0.16_162/0.5)]",
    failed: "bg-destructive shadow-[0_0_6px_oklch(0.62_0.22_27/0.5)]",
  };

  const progressBarClass =
    runStatus === "passed" ? "bg-accent-green"
    : runStatus === "failed" ? "bg-destructive"
    : "bg-gradient-to-r from-accent-blue to-accent-green";

  return (
    <div className="flex flex-col h-screen">
      {/* Topbar */}
      <Topbar
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: test.name, href: `/dashboard/projects/${projectId}` },
          { label: "Run" },
        ]}
        actions={
          <>
            {/* Run pill */}
            <div className="flex items-center gap-2 bg-bg-2 border border-border-highlight rounded-[7px] px-[11px] py-[5px] font-mono text-[11.5px] text-muted-foreground">
              <div className={`w-[7px] h-[7px] rounded-full shrink-0 ${indicatorStyles[runStatus]}`} />
              <span className="truncate max-w-[140px]">{test.name}</span>
            </div>

            <Link href={`/dashboard/projects/${projectId}/tests/${testId}`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-accent-blue/12 border-accent-blue/28 text-accent-blue hover:bg-accent-blue/18 text-[13px] h-8"
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                Edit
              </Button>
            </Link>

            {runStatus === "running" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-destructive/12 border-destructive/28 text-destructive hover:bg-destructive/18 text-[13px] h-8"
              >
                <Square className="h-[10px] w-[10px] mr-1.5 fill-current" />
                Stop
              </Button>
            )}

            {(runStatus === "passed" || runStatus === "failed") && (
              <Button
                size="sm"
                disabled={rerunning}
                className="bg-accent-green text-white hover:bg-[oklch(0.74_0.16_162)] shadow-[0_0_16px_oklch(0.7_0.16_162/0.3)] hover:shadow-[0_0_24px_oklch(0.7_0.16_162/0.45)] border-0 text-[13px] h-8"
                onClick={async () => {
                  setRerunning(true);
                  try {
                    const res = await fetch(`/api/tests/${testId}/run`, {
                      method: "POST",
                    });
                    if (res.ok) {
                      const { runId: newRunId } = await res.json();
                      router.push(
                        `/dashboard/projects/${projectId}/tests/${testId}/runs/${newRunId}`
                      );
                    }
                  } finally {
                    setRerunning(false);
                  }
                }}
              >
                <RotateCcw className="h-3 w-3 mr-1.5" />
                {rerunning ? "Starting..." : "Re-run"}
              </Button>
            )}
          </>
        }
      />

      {/* Split view */}
      <div className="flex-1 overflow-hidden">
        <RunnerLayout
          left={
            <div className="h-full overflow-hidden flex flex-col">
              {/* Panel header */}
              <div className="px-4 py-3.5 border-b border-border shrink-0">
                <div className="flex items-center justify-between mb-[10px]">
                  <span className="text-[10.5px] font-semibold uppercase text-text-tertiary" style={{ letterSpacing: "0.07em" }}>
                    Test Steps
                  </span>
                  <div className={`flex items-center gap-[5px] text-[11px] font-semibold px-[9px] py-[3px] rounded-full border ${chipStyles[runStatus]}`}>
                    <div className={`w-[5px] h-[5px] rounded-full bg-current ${runStatus === "running" ? "animate-ta-pulse" : ""}`} />
                    <span>{runStatus === "running" ? "Running" : runStatus === "passed" ? "Passed" : runStatus === "failed" ? "Failed" : "Pending"}</span>
                  </div>
                </div>
                <div className="h-[3px] bg-bg-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-[width] duration-500 ease-out ${progressBarClass}`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[10.5px] text-text-tertiary">{completedCount} of {totalSteps} steps</span>
                  <span className="text-[10.5px] font-mono text-text-tertiary">
                    {runStatus === "running" ? "..." : runStatus === "pending" ? "—" : "done"}
                  </span>
                </div>
              </div>

              {resolvedAuthConfig ? (
                <div className="border-b border-border bg-[oklch(0.7_0.14_55/0.05)] px-4 py-3 shrink-0">
                  <div className="flex items-start gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-[oklch(0.7_0.14_55)] mt-0.5" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-medium text-foreground">Workflow Auth</span>
                        <span className="text-[9px] font-semibold px-1.5 py-px rounded-full bg-[oklch(0.7_0.14_55/0.12)] text-[oklch(0.7_0.14_55)] border border-[oklch(0.7_0.14_55/0.3)]">
                          {getAuthStrategyLabel(resolvedAuthConfig.strategy)}
                        </span>
                        {isDefaultedAuth && (
                          <span className="text-[9px] font-semibold px-1.5 py-px rounded-full bg-bg-3 text-muted-foreground border border-border">
                            Defaulted
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                        {resolvedAuthConfig.prompt}
                      </p>
                      <div className="mt-1 text-[10px] text-text-tertiary">
                        {resolvedAuthConfig.strategy === "existing_login"
                          ? maskedUsername
                            ? `Saved account: ${maskedUsername}`
                            : "This run expects an existing account."
                          : resolvedAuthConfig.strategy === "create_then_remember"
                          ? maskedUsername
                            ? `Remembered account available: ${maskedUsername}`
                            : "First successful run will create and remember a QA account."
                          : "This run will create a fresh account and log in."}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Steps */}
              <div className="flex-1 overflow-hidden">
                <StepProgress steps={test.steps} runSteps={runSteps} />
              </div>

              {/* Panel footer — stat dots */}
              <div className="px-[14px] py-[11px] border-t border-border flex items-center gap-[10px] shrink-0">
                <div className="flex items-center gap-[5px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                  <span className="text-[11px] text-text-tertiary">{passedCount} passed</span>
                </div>
                <div className="w-px h-3 bg-border-highlight" />
                <div className="flex items-center gap-[5px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                  <span className="text-[11px] text-text-tertiary">{failedCount} failed</span>
                </div>
                <div className="w-px h-3 bg-border-highlight" />
                <div className="flex items-center gap-[5px]">
                  <div className="w-1.5 h-1.5 rounded-full bg-bg-3 border border-border-highlight" />
                  <span className="text-[11px] text-text-tertiary">{pendingCount} pending</span>
                </div>
              </div>
            </div>
          }
          right={
            <BrowserEmbed
              liveViewUrl={liveViewUrl}
              executionMode={executionMode}
              latestScreenshotUrl={latestScreenshotUrl}
              projectUrl={projectUrl}
            />
          }
        />
      </div>
    </div>
  );
}
