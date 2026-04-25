import "server-only";

import { randomUUID } from "crypto";
import { supabase } from "@/lib/supabase/client";
import type { TestStep } from "@/lib/supabase/types";
import type {
  AuthSecrets,
  AuthStrategyConfig,
  CredentialSource,
  MaskedAuthConfig,
  ResolvedAuthConfig,
  TestAuthMode,
} from "./types";
import {
  getAuthDescriptionForStrategy,
  maskWorkflowUsername,
  resolveWorkflowAuthConfigFromStep,
} from "./workflow";

interface TestStepsRow {
  steps: TestStep[] | null;
}

interface UpsertWorkflowAuthParams {
  testId: string;
  mode: TestAuthMode;
  config?: AuthStrategyConfig;
  credentials?: AuthSecrets | null;
  credentialSource?: CredentialSource | null;
}

interface WorkflowAuthState {
  step: TestStep | null;
  authConfig: MaskedAuthConfig | null;
  mode: TestAuthMode;
}

function toMaskedAuthConfig(
  config: AuthStrategyConfig,
  credentials: AuthSecrets | null,
  credentialSource: CredentialSource | null
): MaskedAuthConfig {
  return {
    config,
    hasCredentials: Boolean(credentials),
    usernameHint: credentials ? maskWorkflowUsername(credentials.username) : null,
    credentialSource,
  };
}

function findAuthStep(steps: TestStep[]): TestStep | null {
  return steps.find((step) => step.type === "auth") ?? null;
}

async function getTestSteps(testId: string): Promise<TestStep[]> {
  const { data, error } = await supabase
    .from("tests")
    .select("steps")
    .eq("id", testId)
    .single<TestStepsRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data?.steps ?? [];
}

async function saveTestSteps(testId: string, steps: TestStep[]) {
  const { error } = await supabase
    .from("tests")
    .update({ steps })
    .eq("id", testId);

  if (error) {
    throw new Error(error.message);
  }
}

function getCredentialsFromStep(step: TestStep | null): AuthSecrets | null {
  if (!step?.authCredentials?.username || !step.authCredentials.password) {
    return null;
  }

  return {
    username: step.authCredentials.username,
    password: step.authCredentials.password,
  };
}

function normalizeConfiguredAuthStep(
  existingStep: TestStep | null,
  params: UpsertWorkflowAuthParams
): TestStep {
  if (!params.config) {
    throw new Error("Configured workflow auth requires a strategy.");
  }

  return {
    id: existingStep?.id ?? randomUUID(),
    type: "auth",
    description: getAuthDescriptionForStrategy(params.config),
    authConfig: params.config,
    authCredentials:
      params.credentials === undefined
        ? existingStep?.authCredentials ?? null
        : params.credentials,
    credentialSource:
      params.credentialSource === undefined
        ? existingStep?.credentialSource ?? null
        : params.credentialSource,
    compiledActions: undefined,
    compileStatus: "compiled",
    compileVersion: existingStep?.compileVersion,
    compileNotes: "Auth steps use the configured auth executor.",
    fallbackPolicy: "none",
  };
}

function extractWorkflowAuthState(steps: TestStep[]): WorkflowAuthState {
  const step = findAuthStep(steps);
  const resolvedConfig = resolveWorkflowAuthConfigFromStep(step);
  if (!step || !resolvedConfig) {
    return {
      step: null,
      mode: "none",
      authConfig: null,
    };
  }

  return {
    step,
    mode: "configured",
    authConfig: toMaskedAuthConfig(
      resolvedConfig,
      getCredentialsFromStep(step),
      step.credentialSource ?? null
    ),
  };
}

export async function getTestAuthRow(testId: string) {
  const steps = await getTestSteps(testId);
  return extractWorkflowAuthState(steps).step;
}

export async function getTestAuthConfig(testId: string) {
  const steps = await getTestSteps(testId);
  const state = extractWorkflowAuthState(steps);

  return {
    mode: state.mode,
    authConfig: state.authConfig,
  };
}

export async function upsertTestAuthConfig(params: UpsertWorkflowAuthParams) {
  const steps = await getTestSteps(params.testId);
  const firstAuthIndex = steps.findIndex((step) => step.type === "auth");
  const existingAuthStep = firstAuthIndex >= 0 ? steps[firstAuthIndex] : null;

  if (params.mode === "none") {
    const nextSteps = steps.filter((step) => step.type !== "auth");
    await saveTestSteps(params.testId, nextSteps);
    return;
  }

  const authStep = normalizeConfiguredAuthStep(existingAuthStep, params);
  const nonAuthSteps = steps.filter((step) => step.type !== "auth");
  await saveTestSteps(params.testId, [authStep, ...nonAuthSteps]);
}

export async function resolveAuthConfig(params: {
  testId: string;
}): Promise<ResolvedAuthConfig | null> {
  const authStep = await getTestAuthRow(params.testId);

  if (!authStep?.authConfig) {
    const resolvedConfig = resolveWorkflowAuthConfigFromStep(authStep);
    if (!authStep || !resolvedConfig) {
      return null;
    }

    const credentials = getCredentialsFromStep(authStep);

    return {
      source: "test",
      config: resolvedConfig,
      credentials,
      usernameHint: credentials ? maskWorkflowUsername(credentials.username) : null,
      credentialSource: authStep.credentialSource ?? null,
    };
  }

  const credentials = getCredentialsFromStep(authStep);

  return {
    source: "test",
    config: resolveWorkflowAuthConfigFromStep(authStep)!,
    credentials,
    usernameHint: credentials ? maskWorkflowUsername(credentials.username) : null,
    credentialSource: authStep.credentialSource ?? null,
  };
}

export function generateQaCredentials(baseUrl: string): AuthSecrets {
  const hostname =
    new URL(baseUrl).hostname.replace(/[^a-z0-9]/gi, "").toLowerCase() || "qa";
  const suffix = randomUUID().slice(0, 8);
  const shortHost = hostname.slice(0, 6) || "qa";
  return {
    username: `${shortHost}${suffix}`.slice(0, 16),
    password: `Qa-${suffix}!42`,
  };
}

export async function persistGeneratedCredentials(
  testId: string,
  credentials: AuthSecrets
) {
  const authStep = await getTestAuthRow(testId);
  const resolvedConfig = resolveWorkflowAuthConfigFromStep(authStep);
  if (!authStep || !resolvedConfig) {
    return;
  }

  await upsertTestAuthConfig({
    testId,
    mode: "configured",
    config: resolvedConfig,
    credentials,
    credentialSource: "generated",
  });
}
