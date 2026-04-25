import type { TestStep } from "@/lib/supabase/types";
import type { AuthStrategy, AuthStrategyConfig } from "./types";

const DEFAULT_AUTH_PROMPT =
  "Create a fresh account, then log in and end in the authenticated app.";

export function getDefaultWorkflowAuthConfig(
  prompt?: string | null
): AuthStrategyConfig {
  return {
    strategy: "create_every_run",
    prompt: prompt?.trim() || DEFAULT_AUTH_PROMPT,
  };
}

export function resolveWorkflowAuthConfigFromStep(
  step: TestStep | null | undefined
): AuthStrategyConfig | null {
  if (!step || step.type !== "auth") {
    return null;
  }

  return step.authConfig ?? getDefaultWorkflowAuthConfig(step.description);
}

export function getAuthDescriptionForStrategy(
  config: AuthStrategyConfig
): string {
  switch (config.strategy) {
    case "existing_login":
      return "Authenticate with the configured existing account";
    case "create_then_remember":
      return "Create an account if needed, then log in and remember it for future runs";
    case "create_every_run":
      return "Create a brand new account and log in for this run";
  }
}

export function getAuthStrategyLabel(strategy: AuthStrategy): string {
  switch (strategy) {
    case "existing_login":
      return "Login Existing";
    case "create_then_remember":
      return "Create Then Remember";
    case "create_every_run":
      return "Create Every Run";
  }
}

export function maskWorkflowUsername(value: string): string {
  if (value.length <= 2) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 1)}${"*".repeat(Math.max(3, value.length - 2))}${value.slice(-1)}`;
}
