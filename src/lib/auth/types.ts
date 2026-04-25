import { z } from "zod";

export const testStepTypeSchema = z.enum(["act", "assert", "auth"]);

export const authSecretsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const credentialSourceSchema = z.enum(["manual", "generated"]);
export const authStrategySchema = z.enum([
  "existing_login",
  "create_then_remember",
  "create_every_run",
]);

export const authStrategyConfigSchema = z.object({
  strategy: authStrategySchema,
  prompt: z.string().min(1),
});

export const testAuthModeSchema = z.enum(["configured", "none"]);

export const testAuthPayloadSchema = z.object({
  mode: testAuthModeSchema,
  config: authStrategyConfigSchema.optional(),
  credentials: authSecretsSchema.partial().optional(),
});

export type TestStepType = z.infer<typeof testStepTypeSchema>;
export type AuthSecrets = z.infer<typeof authSecretsSchema>;
export type CredentialSource = z.infer<typeof credentialSourceSchema>;
export type AuthStrategy = z.infer<typeof authStrategySchema>;
export type AuthStrategyConfig = z.infer<typeof authStrategyConfigSchema>;
export type TestAuthMode = z.infer<typeof testAuthModeSchema>;
export type TestAuthPayload = z.infer<typeof testAuthPayloadSchema>;

export interface MaskedAuthConfig {
  config: AuthStrategyConfig;
  hasCredentials: boolean;
  usernameHint: string | null;
  credentialSource: CredentialSource | null;
}

export interface TestAuthConfigResponse {
  mode: TestAuthMode;
  authConfig: MaskedAuthConfig | null;
}

export interface ResolvedAuthConfig {
  source: "test";
  config: AuthStrategyConfig;
  credentials: AuthSecrets | null;
  usernameHint: string | null;
  credentialSource: CredentialSource | null;
}
