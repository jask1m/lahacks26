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
import { Button } from "@/components/ui/button";
import { ArrowLeft, Square, FlaskConical } from "lucide-react";
import Link from "next/link";

export default function TestRunPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const testId = params.testId as string;
  const runId = params.runId as string;

  const [test, setTest] = useState<Test | null>(null);
  const { steps: runSteps, runStatus, liveViewUrl } = useRunStream(runId);

  useEffect(() => {
    async function loadTest() {
      const { data } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();
      setTest(data);
    }
    loadTest();
  }, [testId]);

  if (!test) return <div className="p-6 text-muted-foreground">Loading...</div>;

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
        {runStatus === "running" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            Testing your website...
          </div>
        )}
      </div>

      {/* Split view */}
      <div className="flex-1 overflow-hidden">
        <RunnerLayout
          left={<StepProgress steps={test.steps} runSteps={runSteps} />}
          right={<BrowserEmbed liveViewUrl={liveViewUrl} />}
        />
      </div>
    </div>
  );
}
