export interface Project {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export interface TestStep {
  id: string;
  type: "act" | "assert";
  description: string;
}

export interface Test {
  id: string;
  project_id: string;
  name: string;
  description: string;
  steps: TestStep[];
  created_at: string;
}

export interface TestRun {
  id: string;
  test_id: string;
  status: "pending" | "running" | "passed" | "failed";
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TestRunStep {
  id: string;
  test_run_id: string;
  step_index: number;
  status: "pending" | "running" | "passed" | "failed" | "skipped";
  screenshot_url: string | null;
  details: string | null;
  started_at: string | null;
  completed_at: string | null;
}
