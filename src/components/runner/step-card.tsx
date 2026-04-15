"use client";

import { TestRunStep, TestStep } from "@/lib/supabase/types";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  SkipForward,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface StepCardProps {
  step: TestStep;
  runStep: TestRunStep | undefined;
  index: number;
}

const statusIcons = {
  pending: <Circle className="h-5 w-5 text-muted-foreground" />,
  running: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
  passed: <CheckCircle2 className="h-5 w-5 text-green-600" />,
  failed: <XCircle className="h-5 w-5 text-red-600" />,
  skipped: <SkipForward className="h-5 w-5 text-muted-foreground" />,
};

export function StepCard({ step, runStep, index }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = runStep?.status || "pending";

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        status === "running"
          ? "border-blue-300 bg-blue-50/50"
          : status === "failed"
          ? "border-red-200 bg-red-50/30"
          : status === "passed"
          ? "border-green-200 bg-green-50/30"
          : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{statusIcons[status]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium">{step.description}</span>
            <Badge
              variant="outline"
              className={`shrink-0 text-xs ${
                step.type === "act"
                  ? "border-indigo-200 text-indigo-700 bg-indigo-50"
                  : "border-green-200 text-green-700 bg-green-50"
              }`}
            >
              {step.type === "act" ? (
                <Sparkles className="h-3 w-3 mr-1" />
              ) : (
                <ShieldCheck className="h-3 w-3 mr-1" />
              )}
              {step.type === "act" ? "Act" : "Assert"}
            </Badge>
          </div>

          {runStep?.details && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-1"
            >
              {expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              {status === "running" ? "In progress..." : "Details"}
            </button>
          )}

          {expanded && runStep?.details && (
            <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap bg-muted/50 rounded p-2">
              {runStep.details}
            </pre>
          )}

          {runStep?.screenshot_url && (
            <div className="mt-2">
              <img
                src={runStep.screenshot_url}
                alt={`Screenshot for step ${index + 1}`}
                className="rounded border max-h-40 cursor-pointer hover:opacity-90"
                onClick={() => window.open(runStep.screenshot_url!, "_blank")}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
