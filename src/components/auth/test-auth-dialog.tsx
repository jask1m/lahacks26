"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  AuthSecrets,
  AuthStrategy,
  AuthStrategyConfig,
  CredentialSource,
  TestAuthConfigResponse,
} from "@/lib/auth/types";

const emptyConfig: AuthStrategyConfig = {
  strategy: "existing_login",
  prompt: "",
};

export interface SavedWorkflowAuth {
  config: AuthStrategyConfig;
  credentials?: AuthSecrets | null;
  credentialSource?: CredentialSource | null;
}

interface TestAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testId: string;
  onSaved?: (auth: SavedWorkflowAuth | null) => void;
}

function strategyLabel(strategy: AuthStrategy) {
  switch (strategy) {
    case "existing_login":
      return "Login Existing";
    case "create_then_remember":
      return "Create Then Remember";
    case "create_every_run":
      return "Create Every Run";
  }
}

function defaultPrompt(strategy: AuthStrategy) {
  switch (strategy) {
    case "existing_login":
      return "Log into the existing account and end in the authenticated app.";
    case "create_then_remember":
      return "Create a new account, end logged in, and reuse that account on future runs.";
    case "create_every_run":
      return "Create a brand new account on every run and end logged in.";
  }
}

export function TestAuthDialog({
  open,
  onOpenChange,
  testId,
  onSaved,
}: TestAuthDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [config, setConfig] = useState<AuthStrategyConfig>(emptyConfig);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [usernameHint, setUsernameHint] = useState<string | null>(null);
  const [credentialSource, setCredentialSource] =
    useState<CredentialSource | null>(null);

  useEffect(() => {
    if (!open) return;

    async function loadConfig() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/tests/${testId}/auth`);
        const data = (await res.json()) as TestAuthConfigResponse & {
          error?: string;
        };

        if (!res.ok) {
          throw new Error(data.error || "Failed to load test auth config");
        }

        setEnabled(data.mode === "configured");
        setConfig(data.authConfig?.config ?? emptyConfig);
        setUsername("");
        setPassword("");
        setUsernameHint(data.authConfig?.usernameHint ?? null);
        setCredentialSource(data.authConfig?.credentialSource ?? null);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load test auth config"
        );
      } finally {
        setLoading(false);
      }
    }

    void loadConfig();
  }, [open, testId]);

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/tests/${testId}/auth`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: enabled ? "configured" : "none",
          config: enabled ? config : undefined,
          credentials:
            enabled && config.strategy === "existing_login"
              ? {
                  username,
                  password,
                }
              : undefined,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!res.ok) {
        throw new Error(data?.error || "Failed to save test auth config");
      }

      onSaved?.(
        enabled
          ? {
              config,
              credentials:
                config.strategy === "existing_login" &&
                username.trim() &&
                password.trim()
                  ? {
                      username: username.trim(),
                      password: password.trim(),
                    }
                  : null,
              credentialSource:
                config.strategy === "existing_login"
                  ? username.trim() || password.trim()
                    ? "manual"
                    : credentialSource
                  : credentialSource,
            }
          : null
      );
      onOpenChange(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save test auth config"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Workflow Auth</DialogTitle>
          <DialogDescription>
            Choose how this workflow should handle account creation and login.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-muted-foreground">
            Loading auth config...
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Badge
                className={`cursor-pointer ${
                  enabled
                    ? "bg-amber-100 text-amber-800"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setEnabled(true)}
              >
                Enabled
              </Badge>
              <Badge
                className={`cursor-pointer ${
                  !enabled
                    ? "bg-slate-200 text-slate-700"
                    : "bg-muted text-muted-foreground"
                }`}
                onClick={() => setEnabled(false)}
              >
                Disabled
              </Badge>
            </div>

            {!enabled ? (
              <p className="text-sm text-muted-foreground">
                This workflow will run without an auth block.
              </p>
            ) : null}

            {enabled ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Auth Strategy</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "existing_login",
                        "create_then_remember",
                        "create_every_run",
                      ] as AuthStrategy[]
                    ).map((strategy) => (
                      <Badge
                        key={strategy}
                        className={`cursor-pointer ${
                          config.strategy === strategy
                            ? "bg-amber-100 text-amber-800"
                            : "bg-muted text-muted-foreground"
                        }`}
                        onClick={() =>
                          setConfig((current) => ({
                            ...current,
                            strategy,
                            prompt:
                              !current.prompt ||
                              current.prompt === defaultPrompt(current.strategy)
                                ? defaultPrompt(strategy)
                                : current.prompt,
                          }))
                        }
                      >
                        {strategyLabel(strategy)}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="auth-goal">Auth Goal</Label>
                  <Textarea
                    id="auth-goal"
                    rows={4}
                    value={config.prompt}
                    onChange={(e) =>
                      setConfig((current) => ({
                        ...current,
                        prompt: e.target.value,
                      }))
                    }
                    placeholder={defaultPrompt(config.strategy)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe the full auth loop. The auth block can perform
                    multiple internal act/assert steps such as sign up, log in,
                    and post-login verification.
                  </p>
                </div>

                {config.strategy === "existing_login" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="auth-username">
                        Existing Account Username
                        {usernameHint ? ` (${usernameHint} saved)` : ""}
                      </Label>
                      <Input
                        id="auth-username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="test-user@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="auth-password">
                        Existing Account Password
                      </Label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={
                          usernameHint
                            ? "Leave blank to keep saved password"
                            : "Password"
                        }
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {config.strategy === "create_then_remember"
                      ? usernameHint
                        ? `A remembered QA account already exists (${usernameHint}, ${
                            credentialSource === "generated"
                              ? "generated"
                              : "manual"
                          }). Future runs will log in with it.`
                        : "The first run will create a QA account and remember it for future login."
                      : "Each run will generate a fresh QA account, sign up, and log in again."}
                  </p>
                )}

                <div className="rounded-lg border p-3 text-xs text-muted-foreground">
                  V1 stores reusable QA credentials in plaintext for speed. Use
                  disposable test accounts only.
                </div>
              </div>
            ) : null}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Workflow Auth"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
