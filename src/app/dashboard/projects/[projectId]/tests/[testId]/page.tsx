"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Test, TestStep } from "@/lib/supabase/types";
import { WorkflowEditor } from "@/components/workflow/workflow-editor";
import {
  TestAuthDialog,
  type SavedWorkflowAuth,
} from "@/components/auth/test-auth-dialog";
import { Button } from "@/components/ui/button";
import { KeyRound } from "lucide-react";
import { getAuthDescriptionForStrategy } from "@/lib/auth/workflow";
import { v4 as uuidv4 } from "uuid";

export default function TestEditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const testId = params.testId as string;

  const [test, setTest] = useState<Test | null>(null);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const syncAuthStep = useCallback((auth: SavedWorkflowAuth | null) => {
    setSteps((currentSteps) => {
      const nonAuthSteps = currentSteps.filter((step) => step.type !== "auth");
      if (!auth) {
        return nonAuthSteps;
      }

      const authStep = currentSteps.find((step) => step.type === "auth");
      const persistedCredentials =
        auth.config.strategy === "create_every_run"
          ? null
          : auth.credentials ?? authStep?.authCredentials ?? null;
      const persistedCredentialSource =
        auth.config.strategy === "create_every_run"
          ? null
          : auth.credentialSource ?? authStep?.credentialSource ?? null;
      const nextAuthStep: TestStep = authStep
        ? {
            ...authStep,
            description: getAuthDescriptionForStrategy(auth.config),
            authConfig: auth.config,
            authCredentials: persistedCredentials,
            credentialSource: persistedCredentialSource,
          }
        : {
            id: uuidv4(),
            type: "auth",
            description: getAuthDescriptionForStrategy(auth.config),
            authConfig: auth.config,
            authCredentials: persistedCredentials,
            credentialSource: persistedCredentialSource,
            compileStatus: "compiled",
            compileNotes: `Workflow auth strategy: ${auth.config.strategy}`,
            fallbackPolicy: "none",
          };

      return [nextAuthStep, ...nonAuthSteps];
    });
  }, []);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("tests")
        .select("*")
        .eq("id", testId)
        .single();
      if (data) {
        setTest(data);
        setSteps(data.steps || []);
      }
      setLoading(false);
    }
    load();
  }, [testId]);

  const handleSave = useCallback(async () => {
    if (!test) return;
    setSaving(true);
    await fetch(`/api/tests/${testId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps, name: test.name }),
    });
    setSaving(false);
  }, [test, testId, steps]);

  const handleStepsChange = useCallback(
    (newSteps: TestStep[]) => {
      setSteps(newSteps);
      // Auto-save with debounce
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(async () => {
        await fetch(`/api/tests/${testId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ steps: newSteps, name: test?.name }),
        });
      }, 1500);
    },
    [testId, test]
  );

  const handleRun = useCallback(async () => {
    // Save first, then navigate to run
    await fetch(`/api/tests/${testId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps, name: test?.name }),
    });

    // Start a run
    const res = await fetch(`/api/tests/${testId}/run`, {
      method: "POST",
    });

    if (res.ok) {
      const { runId } = await res.json();
      router.push(
        `/dashboard/projects/${projectId}/tests/${testId}/runs/${runId}`
      );
    }
  }, [testId, projectId, steps, test, router]);

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!test) return <div className="p-6">Test not found</div>;

  return (
    <div className="h-screen">
      <WorkflowEditor
        testName={test.name}
        steps={steps}
        onStepsChange={handleStepsChange}
        onSave={handleSave}
        onRun={handleRun}
        saving={saving}
        toolbarActions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAuthDialogOpen(true)}
          >
            <KeyRound className="h-4 w-4 mr-2" />
            Test Auth
          </Button>
        }
      />
      <TestAuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        testId={testId}
        onSaved={syncAuthStep}
      />
    </div>
  );
}
