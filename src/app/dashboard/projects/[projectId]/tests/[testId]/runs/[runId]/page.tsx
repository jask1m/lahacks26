"use client";

import { useEffect, useState } from "react";
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
import { FlaskConical, KeyRound, RotateCcw, Pencil, Square } from "lucide-react";
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
      setExecutionMode(
        projectData?.execution_mode ??
          getProjectExecutionModeFromString(
            projectData?.url ?? "https://example.com"
          )
      );
    }
    loadTest();
  }, [projectId, testId]);

  if (!test) return <div className="p-7 text-muted-foreground">Loading...</div>;

  const authStep = test.steps.find((step) => step.type === "auth") ?? null;
  const resolvedAuthConfig = resolveWorkflowAuthConfigFromStep(authStep);
  const isDefaultedAuth = Boolean(authStep && !authStep.authConfig);
  const maskedUsername = authStep?.authCredentials?.username
    ? maskWorkflowUsername(authStep.authCredentials.username)
    : null;

  const statusColors: Record<string, string> = {
    pending: "bg-bg-3 text-muted-foreground",
    running: "bg-accent-blue/15 text-accent-blue",
    passed: "bg-accent-green/15 text-accent-green",
    failed: "bg-destructive/15 text-destructive",
  };

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
            <Link href={`/dashboard/projects/${projectId}/tests/${testId}`}>
              <Button
                variant="outline"
                size="sm"
                className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground text-[13px] h-8"
              >
                <Pencil className="h-3 w-3 mr-1.5" />
                Edit Test
              </Button>
            </Link>
            {(runStatus === "passed" || runStatus === "failed") && (
              <Button
                size="sm"
                variant="outline"
                disabled={rerunning}
                className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground text-[13px] h-8"
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
                {rerunning ? "Starting..." : "Rerun"}
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
              {/* Header */}
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <FlaskConical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-heading text-[13px] font-semibold text-foreground truncate">
                    {test.name}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[runStatus]}`}>
                    {runStatus}
                  </span>
                </div>
              </div>

              {resolvedAuthConfig ? (
                <div className="border-b border-border bg-[oklch(0.7_0.14_55/0.05)] px-5 py-3">
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

              {/* Status bar */}
              <div className="px-5 py-2.5 border-t border-border bg-bg-1 flex items-center justify-between">
                {runStatus === "running" ? (
                  <div className="flex items-center gap-2 text-accent-green text-[12px] font-medium">
                    <div className="w-[7px] h-[7px] bg-accent-green rounded-full animate-ta-pulse" />
                    Testing your website...
                  </div>
                ) : (
                  <div className="text-[12px] text-text-tertiary">
                    {runStatus === "passed" ? "All steps passed" : runStatus === "failed" ? "Test failed" : "Waiting..."}
                  </div>
                )}
                {runStatus === "running" && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-destructive/30 text-destructive hover:bg-destructive/10 text-[12px] h-7 px-2.5"
                  >
                    <Square className="h-[10px] w-[10px] mr-1.5 fill-current" />
                    Stop Test
                  </Button>
                )}
              </div>
            </div>
          }
          right={
            <BrowserEmbed
              liveViewUrl={liveViewUrl}
              executionMode={executionMode}
            />
          }
        />
      </div>
    </div>
  );
}
