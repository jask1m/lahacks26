"use client";

import { TestRunStep, TestStep } from "@/lib/supabase/types";
import { ChevronRight } from "lucide-react";
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

const TAG_STYLES = {
  act: "bg-accent-blue/12 text-accent-blue border-accent-blue/28",
  assert: "bg-accent-green/12 text-accent-green border-accent-green/28",
  auth: "bg-[oklch(0.7_0.14_55/0.1)] text-[oklch(0.7_0.14_55)] border-[oklch(0.7_0.14_55/0.28)]",
} as const;

const TAG_LABELS = { act: "ACT", assert: "ASSERT", auth: "AUTH" } as const;

function formatElapsed(startedAt: string | null | undefined, completedAt: string | null | undefined): string | null {
  if (!startedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = (end - start) / 1000;
  return `${seconds.toFixed(1)}s`;
}

export function StepCard({ step, runStep, index }: StepCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const status = runStep?.status || "pending";
  const errorReport = status === "failed" ? tryParseErrorReport(runStep?.details) : null;
  const parsedDetails = parseRunDetails(runStep?.details);
  const hasDetails = runStep?.details && (status === "passed" || status === "failed");
  const elapsed = formatElapsed(runStep?.started_at, runStep?.completed_at);

  return (
    <div className={`rounded-lg mb-0.5 overflow-hidden ${status === "running" ? "bg-bg-2" : ""}`}>
      {/* Main row */}
      <div
        className={`flex items-start gap-[10px] px-[10px] py-[9px] rounded-lg cursor-pointer transition-colors ${
          hasDetails ? "" : "cursor-default"
        } hover:bg-bg-2`}
        onClick={() => hasDetails && setExpanded(!expanded)}
      >
        {/* Status circle */}
        <div
          className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[9.5px] font-semibold font-mono border transition-all ${
            status === "running"
              ? "bg-accent-blue/12 border-accent-blue/28 text-accent-blue"
              : status === "passed"
              ? "bg-accent-green/10 border-accent-green/28 text-accent-green"
              : status === "failed"
              ? "bg-destructive/10 border-destructive/28 text-destructive"
              : "bg-bg-3 border-border-highlight text-text-tertiary"
          }`}
        >
          {status === "running" ? (
            <div className="w-[7px] h-[7px] bg-accent-blue rounded-full animate-ta-pulse" />
          ) : status === "passed" ? (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : status === "failed" ? (
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            index + 1
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className={`text-[9px] font-bold uppercase px-1.5 py-px rounded-full border shrink-0 ${TAG_STYLES[step.type]}`}
              style={{ letterSpacing: "0.04em" }}
            >
              {TAG_LABELS[step.type]}
            </span>
          </div>
          <div
            className={`text-[12px] leading-[1.48] line-clamp-2 ${
              status === "pending" ? "text-text-tertiary" : "text-foreground"
            }`}
          >
            {step.description}
          </div>
          <div className={`flex items-center gap-[5px] text-[11px] mt-1 ${
            status === "running" ? "text-accent-blue"
            : status === "passed" ? "text-accent-green"
            : status === "failed" ? "text-destructive"
            : "text-text-tertiary"
          }`}>
            <span>
              {status === "running" ? "Running..." : status === "passed" ? "Passed" : status === "failed" ? "Failed" : "Pending"}
            </span>
            {elapsed && (
              <span className="text-[10px] font-mono text-text-tertiary ml-auto">{elapsed}</span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        {hasDetails && (
          <ChevronRight
            className={`h-[11px] w-[11px] shrink-0 mt-[5px] text-text-tertiary transition-transform duration-150 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        )}
      </div>

      {/* Expanded detail */}
      {expanded && hasDetails && (
        <div className="pl-[42px] pr-[10px] pb-[9px]">
          {errorReport ? (
            <div className="bg-bg-2 border border-border rounded-[7px] p-[9px_11px] text-[11px] leading-[1.55] space-y-2.5">
              <section>
                <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] mb-1">How to reproduce</div>
                <ol className="list-decimal pl-5 space-y-0.5 text-muted-foreground">
                  {errorReport.repro.map((r, idx) => (
                    <li key={idx}>{r}</li>
                  ))}
                </ol>
              </section>
              <section>
                <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] mb-1">Why it failed</div>
                <p className="text-muted-foreground whitespace-pre-wrap">{errorReport.cause}</p>
              </section>
              <section>
                <div className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] mb-1">Proposed fix</div>
                <p className="text-muted-foreground whitespace-pre-wrap">{errorReport.fix}</p>
              </section>
              {errorReport.raw && (
                <section>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setRawOpen((v) => !v); }}
                    className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ChevronRight className={`h-3 w-3 transition-transform duration-150 ${rawOpen ? "rotate-90" : ""}`} />
                    {rawOpen ? "Hide raw error" : "Show raw error"}
                  </button>
                  {rawOpen && (
                    <pre className="mt-2 whitespace-pre-wrap bg-bg-3 rounded p-2 text-muted-foreground text-[10px]">
                      {errorReport.raw}
                    </pre>
                  )}
                </section>
              )}
            </div>
          ) : parsedDetails ? (
            <div className="bg-bg-2 border border-border rounded-[7px] p-[9px_11px] text-[11px] leading-[1.55] space-y-1.5 overflow-hidden">
              {parsedDetails.summary && (
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] shrink-0 pt-px w-[52px]">Result</span>
                  <span className={`text-[11px] min-w-0 break-words ${status === "passed" ? "text-accent-green" : status === "failed" ? "text-destructive" : "text-muted-foreground"}`}>
                    {parsedDetails.summary}
                  </span>
                </div>
              )}
              {parsedDetails.compileNotes && (
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] shrink-0 pt-px w-[52px]">Notes</span>
                  <span className="text-muted-foreground min-w-0 break-words">{parsedDetails.compileNotes}</span>
                </div>
              )}
              {parsedDetails.completed && parsedDetails.completed.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] shrink-0 pt-px w-[52px]">Done</span>
                  <pre className="text-muted-foreground whitespace-pre-wrap min-w-0 break-words">{parsedDetails.completed.join("\n")}</pre>
                </div>
              )}
              {parsedDetails.failure && (
                <div className="flex gap-2">
                  <span className="text-[10px] uppercase font-semibold text-text-tertiary tracking-[0.04em] shrink-0 pt-px w-[52px]">Error</span>
                  <pre className="text-destructive whitespace-pre-wrap min-w-0 break-words">{parsedDetails.failure}</pre>
                </div>
              )}
            </div>
          ) : (
            <pre className="bg-bg-2 border border-border rounded-[7px] p-[9px_11px] text-[11px] text-muted-foreground whitespace-pre-wrap">
              {runStep?.details}
            </pre>
          )}

          {runStep?.screenshot_url && (
            <div
              className="mt-2 rounded-[5px] border border-border bg-bg-3 overflow-hidden cursor-pointer hover:opacity-90"
              onClick={(e) => { e.stopPropagation(); window.open(runStep.screenshot_url!, "_blank"); }}
            >
              <img
                src={runStep.screenshot_url}
                alt="Step screenshot"
                className="w-full h-auto block"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
