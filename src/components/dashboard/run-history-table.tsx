"use client";

import { useRouter } from "next/navigation";
import { TestRunWithDetails } from "@/lib/supabase/types";
import { FlaskConical, Globe, ChevronRight } from "lucide-react";

interface RunHistoryTableProps {
  runs: TestRunWithDetails[];
  loading?: boolean;
}

const STATUS_STYLES = {
  pending: "bg-bg-3 text-text-tertiary border-border-highlight",
  running: "bg-accent-blue/12 text-accent-blue border-accent-blue/28",
  passed: "bg-accent-green/12 text-accent-green border-accent-green/28",
  failed: "bg-destructive/12 text-destructive border-destructive/28",
} as const;

const STATUS_LABELS = {
  pending: "Pending",
  running: "Running",
  passed: "Passed",
  failed: "Failed",
} as const;

function formatDuration(
  startedAt: string | null,
  completedAt: string | null
): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const seconds = Math.round((end - start) / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(date).toLocaleDateString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="bg-bg-1 border border-border rounded-lg px-5 py-4 flex items-center gap-4 animate-pulse"
        >
          <div className="w-8 h-8 bg-bg-3 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-bg-3 rounded w-1/3" />
            <div className="h-3 bg-bg-3 rounded w-1/4" />
          </div>
          <div className="h-6 w-16 bg-bg-3 rounded-full" />
          <div className="h-4 w-20 bg-bg-3 rounded" />
          <div className="h-4 w-12 bg-bg-3 rounded" />
          <div className="h-4 w-16 bg-bg-3 rounded" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-full bg-bg-2 p-4 mb-4">
        <FlaskConical className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-1">No runs yet</h2>
      <p className="text-muted-foreground">
        Run a test to see your history here
      </p>
    </div>
  );
}

export function RunHistoryTable({ runs, loading }: RunHistoryTableProps) {
  const router = useRouter();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (runs.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="grid grid-cols-[1fr_1fr_100px_100px_80px_60px_24px] gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary border-b border-border">
        <div>Test</div>
        <div>Project</div>
        <div>Status</div>
        <div>Started</div>
        <div>Duration</div>
        <div>Steps</div>
        <div></div>
      </div>

      {/* Table Body */}
      <div className="flex flex-col">
        {runs.map((run) => {
          const projectId = run.tests.projects.id;
          const testId = run.tests.id;

          return (
            <div
              key={run.id}
              onClick={() =>
                router.push(
                  `/dashboard/projects/${projectId}/tests/${testId}/runs/${run.id}`
                )
              }
              className="grid grid-cols-[1fr_1fr_100px_100px_80px_60px_24px] gap-4 px-5 py-4 items-center cursor-pointer transition-all hover:bg-bg-2 border-b border-border last:border-b-0"
            >
              {/* Test Name */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 bg-bg-3 rounded-lg flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4 text-text-tertiary" />
                </div>
                <span className="text-[13px] font-medium text-foreground truncate">
                  {run.tests.name}
                </span>
              </div>

              {/* Project Name */}
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
                <span className="text-[12px] text-muted-foreground truncate">
                  {run.tests.projects.name}
                </span>
              </div>

              {/* Status Badge */}
              <div>
                <span
                  className={`inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-full border ${STATUS_STYLES[run.status]}`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full bg-current ${
                      run.status === "running" ? "animate-ta-pulse" : ""
                    }`}
                  />
                  {STATUS_LABELS[run.status]}
                </span>
              </div>

              {/* Started */}
              <div className="text-[12px] text-muted-foreground">
                {formatRelativeTime(run.created_at)}
              </div>

              {/* Duration */}
              <div className="text-[12px] font-mono text-text-tertiary">
                {formatDuration(run.started_at, run.completed_at)}
              </div>

              {/* Steps */}
              <div className="text-[12px] text-muted-foreground">
                {run.tests.steps.length}
              </div>

              {/* Chevron */}
              <ChevronRight className="h-3.5 w-3.5 text-text-tertiary" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
