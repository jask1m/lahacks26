"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Test } from "@/lib/supabase/types";
import { useRunStream } from "@/hooks/use-run-stream";
import { RunnerLayout } from "@/components/runner/runner-layout";
import { StepProgress } from "@/components/runner/step-progress";
import { BrowserEmbed } from "@/components/runner/browser-embed";
import { Badge } from "@/components/ui/badge";
import {
  getAuthStrategyLabel,
  maskWorkflowUsername,
  resolveWorkflowAuthConfigFromStep,
} from "@/lib/auth/workflow";
import {
  getProjectExecutionModeFromString,
  type ProjectExecutionMode,
} from "@/lib/projects/url";
import { ArrowLeft, FlaskConical, KeyRound, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

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

  if (!test) return <div className="p-6 text-muted-foreground">Loading...</div>;

  const authStep = test.steps.find((step) => step.type === "auth") ?? null;
  const resolvedAuthConfig = resolveWorkflowAuthConfigFromStep(authStep);
  const isDefaultedAuth = Boolean(authStep && !authStep.authConfig);
  const maskedUsername = authStep?.authCredentials?.username
    ? maskWorkflowUsername(authStep.authCredentials.username)
    : null;

  const statusColors = {
    pending: "bg-muted text-muted-foreground",
    running: "bg-blue-100 text-blue-700",
    passed: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div className="flex items-center gap-3">
          <Link
            href={`/dashboard/projects/${projectId}/tests/${testId}`}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <FlaskConical className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">{test.name}</span>
          <Badge className={statusColors[runStatus]}>{runStatus}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {runStatus === "running" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Testing your website...
            </div>
          )}
          {(runStatus === "passed" || runStatus === "failed") && (
            <Button
              size="sm"
              variant="outline"
              disabled={rerunning}
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
              <RotateCcw className="h-4 w-4 mr-1" />
              {rerunning ? "Starting..." : "Rerun"}
            </Button>
          )}
        </div>
      </div>

      {/* Split view */}
      <div className="flex-1 overflow-hidden">
        <RunnerLayout
          left={
            <div className="h-full overflow-hidden">
              {resolvedAuthConfig ? (
                <div className="border-b bg-amber-50/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-amber-700" />
                        <span className="text-sm font-medium">Workflow Auth</span>
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                          {getAuthStrategyLabel(resolvedAuthConfig.strategy)}
                        </Badge>
                        {isDefaultedAuth ? (
                          <Badge
                            variant="outline"
                            className="border-slate-200 text-slate-700 bg-white"
                          >
                            Defaulted
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {resolvedAuthConfig.prompt}
                      </p>
                      <div className="mt-2 text-xs text-muted-foreground">
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
              <StepProgress steps={test.steps} runSteps={runSteps} />
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
