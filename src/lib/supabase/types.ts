import type { ExecutableAction } from "@/lib/execution/actions";
import type { ProjectExecutionMode } from "@/lib/projects/url";
import type {
  AuthStrategyConfig,
  CredentialSource,
  TestAuthMode,
  TestStepType,
} from "@/lib/auth/types";

export interface Project {
  id: string;
  name: string;
  url: string;
  execution_mode?: ProjectExecutionMode;
  created_at: string;
}

export interface TestStep {
  id: string;
  type: TestStepType;
  description: string;
  authConfig?: AuthStrategyConfig;
  authCredentials?: {
    username: string;
    password: string;
  } | null;
  credentialSource?: CredentialSource | null;
  compiledActions?: ExecutableAction[];
  compileStatus?: "pending" | "compiled" | "failed";
  compileVersion?: number;
  compileNotes?: string;
  fallbackPolicy?: "llm_on_failure" | "none";
}

export interface Test {
  id: string;
  project_id: string;
  name: string;
  description: string;
  steps: TestStep[];
  created_at: string;
}

export interface ProjectAuthConfig {
  project_id: string;
  config: AuthStrategyConfig;
  username: string;
  password: string;
  credential_source: CredentialSource;
  updated_at: string;
}

export interface TestAuthConfig {
  test_id: string;
  mode: TestAuthMode;
  config: AuthStrategyConfig | null;
  username: string | null;
  password: string | null;
  credential_source: CredentialSource | null;
  updated_at: string;
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
