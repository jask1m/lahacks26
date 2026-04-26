import type { TestStep } from "@/lib/supabase/types";
import type { ProjectExecutionMode } from "@/lib/projects/url";
import type { StructuredErrorReport } from "@/lib/execution/error-report";

export interface LocalProject {
  id: string;
  name: string;
  url: string;
  executionMode: ProjectExecutionMode;
  createdAt: string;
}

export interface LocalTest {
  id: string;
  projectId: string;
  /** Optional grouping for tests proposed together as a suite. */
  suiteId?: string;
  name: string;
  description: string;
  steps: TestStep[];
  createdAt: string;
}

export type RunStatus = "running" | "passed" | "failed";
export type StepStatus = "pending" | "running" | "passed" | "failed" | "skipped";

export interface LocalRunStep {
  stepIndex: number;
  status: StepStatus;
  details?: string;
  screenshotPath?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface LocalRun {
  id: string;
  testId: string;
  status: RunStatus;
  startedAt: string;
  completedAt?: string;
  steps: LocalRunStep[];
  failure?: StructuredErrorReport;
  liveViewUrl?: string;
  sessionReplayUrl?: string;
}

export interface StateFile {
  version: 1;
  projects: LocalProject[];
  tests: LocalTest[];
  runs: LocalRun[];
}

export function emptyState(): StateFile {
  return { version: 1, projects: [], tests: [], runs: [] };
}
