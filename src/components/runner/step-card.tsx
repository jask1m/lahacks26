"use client";

import { TestRunStep, TestStep } from "@/lib/supabase/types";
import {
  Check,
  X as XIcon,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import { tryParseErrorReport } from "@/lib/execution/error-report";

interface StepCardProps {
  step: TestStep;
  runStep: TestRunStep | undefined;
  index: number;
}

interface ParsedRunDetails {
  summary: string;
  mode?: "auth" | "compiled" | "fallback";
  fallbackUsed?: boolean;
  compileStatus?: "pending" | "compiled" | "failed";
  compileNotes?: string;
  completed?: string[];
  failure?: string;
  raw?: string;
}

function parseRunDetails(details: string | null | undefined): ParsedRunDetails | null {
  if (!details) return null;
  try {
    const parsed = JSON.parse(details) as ParsedRunDetails;
    if (typeof parsed.summary === "string") return parsed;
  } catch {}
  return { summary: details, raw: details };
}

export function StepCard({ step, runStep, index }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const status = runStep?.status || "pending";
  const errorReport =
    status === "failed" ? tryParseErrorReport(runStep?.details) : null;
  const parsedDetails = parseRunDetails(runStep?.details);

  const isAct = step.type === "act";
  const isAuth = step.type === "auth";

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-md transition-colors hover:bg-bg-2">
      {/* Numbered circle */}
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-mono font-medium ${
          status === "running"
            ? "bg-accent-blue/15 border border-accent-blue/30 text-accent-blue"
            : status === "passed"
            ? "bg-accent-green/15 border border-accent-green/30 text-accent-green"
            : status === "failed"
            ? "bg-destructive/15 border border-destructive/30 text-destructive"
            : "bg-bg-3 border border-border text-text-tertiary"
        }`}
      >
        {status === "running" ? (
          <div className="w-[5px] h-[5px] bg-accent-blue rounded-full animate-ta-pulse" />
        ) : status === "passed" ? (
          <Check className="h-[9px] w-[9px]" strokeWidth={2.5} />
        ) : status === "failed" ? (
          <XIcon className="h-[9px] w-[9px]" strokeWidth={2.5} />
        ) : (
          index + 1
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-foreground leading-snug">
          {step.description}
        </div>
        <div className="flex items-center gap-1.5 mt-1 text-[11px] text-text-tertiary">
          <span
            className={`text-[9px] font-semibold px-1.5 py-px rounded-full border ${
              isAct
                ? "bg-accent-blue/12 text-accent-blue border-accent-blue/30"
                : isAuth
                ? "bg-[oklch(0.7_0.14_55/0.12)] text-[oklch(0.7_0.14_55)] border-[oklch(0.7_0.14_55/0.3)]"
                : "bg-accent-green/12 text-accent-green border-accent-green/30"
            }`}
          >
            {isAct ? "Act" : isAuth ? "Auth" : "Assert"}
          </span>
          {status === "running"
            ? "running..."
            : status === "passed"
            ? "completed"
            : status === "failed"
            ? "failed"
            : "pending"}
        </div>

        {parsedDetails?.summary && status !== "pending" && (
          <p className="text-[11px] text-muted-foreground mt-1">{parsedDetails.summary}</p>
        )}

        {runStep?.details && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground mt-1"
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
          errorReport ? (
            <div className="mt-2 space-y-3 text-[11px]">
              <section>
                <div className="font-semibold text-foreground mb-1">How to reproduce</div>
                <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                  {errorReport.repro.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ol>
              </section>
              <section>
                <div className="font-semibold text-foreground mb-1">Why it failed</div>
                <p className="text-muted-foreground whitespace-pre-wrap">{errorReport.cause}</p>
              </section>
              <section>
                <div className="font-semibold text-foreground mb-1">Proposed fix</div>
                <p className="text-muted-foreground whitespace-pre-wrap">{errorReport.fix}</p>
              </section>
              {errorReport.raw && (
                <section>
                  <button
                    type="button"
                    onClick={() => setRawOpen((v) => !v)}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    {rawOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {rawOpen ? "Hide raw error" : "Show raw error"}
                  </button>
                  {rawOpen && (
                    <pre className="mt-2 whitespace-pre-wrap bg-bg-2 rounded p-2 text-muted-foreground">
                      {errorReport.raw}
                    </pre>
                  )}
                </section>
              )}
            </div>
          ) : parsedDetails ? (
            <div className="text-[11px] text-muted-foreground mt-2 whitespace-pre-wrap bg-bg-2 rounded p-2 space-y-2">
              {parsedDetails.compileNotes && <p>Compile notes: {parsedDetails.compileNotes}</p>}
              {parsedDetails.completed && parsedDetails.completed.length > 0 && (
                <div>
                  <p className="font-medium text-foreground/80">Completed</p>
                  <pre className="whitespace-pre-wrap">{parsedDetails.completed.join("\n")}</pre>
                </div>
              )}
              {parsedDetails.failure && (
                <div>
                  <p className="font-medium text-destructive">Failure</p>
                  <pre className="whitespace-pre-wrap">{parsedDetails.failure}</pre>
                </div>
              )}
              {parsedDetails.raw && <pre className="whitespace-pre-wrap">{parsedDetails.raw}</pre>}
            </div>
          ) : (
            <pre className="text-[11px] text-muted-foreground mt-2 whitespace-pre-wrap bg-bg-2 rounded p-2">
              {runStep.details}
            </pre>
          )
        )}

        {runStep?.screenshot_url && (
          <div className="mt-2">
            <img
              src={runStep.screenshot_url}
              alt={`Screenshot for step ${index + 1}`}
              className="rounded border border-border max-h-40 cursor-pointer hover:opacity-90"
              onClick={() => window.open(runStep.screenshot_url!, "_blank")}
            />
          </div>
        )}
      </div>
    </div>
  );
}
