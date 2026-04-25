"use client";

import { useCallback, useState } from "react";
import { TestStep } from "@/lib/supabase/types";
import { StepNode } from "./step-node";
import { AddNodeButton } from "./add-node-button";
import { AddStepModal } from "./add-step-modal";
import { Button } from "@/components/ui/button";
import { Play, Save, Sparkles, CheckCircle2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface WorkflowEditorProps {
  testName: string;
  steps: TestStep[];
  onStepsChange: (steps: TestStep[]) => void;
  onSave: () => void;
  onRun: () => void;
  saving?: boolean;
  toolbarActions?: React.ReactNode;
}

function Connector() {
  return <div className="w-px h-6 bg-gray-300" />;
}

export function WorkflowEditor({
  testName,
  steps,
  onStepsChange,
  onSave,
  onRun,
  saving,
  toolbarActions,
}: WorkflowEditorProps) {
  // Modal state: which insert index the + button was clicked at
  const [modalInsertIndex, setModalInsertIndex] = useState<number | null>(null);
  // Track which step ID should auto-focus (just added)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null);

  const handleDelete = useCallback(
    (id: string) => {
      onStepsChange(steps.filter((s) => s.id !== id));
    },
    [steps, onStepsChange]
  );

  const handleEdit = useCallback(
    (id: string, description: string) => {
      onStepsChange(
        steps.map((s) => (s.id === id ? { ...s, description } : s))
      );
    },
    [steps, onStepsChange]
  );

  const handleAddStep = useCallback(
    (type: "act" | "assert" | "auth") => {
      if (modalInsertIndex === null) return;
      const newStep: TestStep = { id: uuidv4(), type, description: "" };
      const newSteps = [...steps];
      newSteps.splice(modalInsertIndex, 0, newStep);
      onStepsChange(newSteps);
      setAutoFocusId(newStep.id);
      setModalInsertIndex(null);
    },
    [modalInsertIndex, steps, onStepsChange]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div />
        <div className="flex items-center gap-2">
          {toolbarActions}
          <Button variant="outline" size="sm" onClick={onSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button size="sm" onClick={onRun}>
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>

      {/* Scrollable workflow area */}
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="flex flex-col items-center py-10 px-4">
          {/* Title */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">
              {testName}
            </span>
          </div>

          {/* Steps with connectors and + buttons */}
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-full max-w-[460px]">
              <Connector />
              <AddNodeButton onClick={() => setModalInsertIndex(index)} />
              <Connector />
              <StepNode
                step={step}
                onEdit={handleEdit}
                onDelete={handleDelete}
                autoFocus={autoFocusId === step.id}
              />
            </div>
          ))}

          {/* Final + button and End node */}
          <Connector />
          <AddNodeButton onClick={() => setModalInsertIndex(steps.length)} />
          <Connector />
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">End</span>
          </div>
        </div>
      </div>

      {/* Add step modal */}
      <AddStepModal
        open={modalInsertIndex !== null}
        onClose={() => setModalInsertIndex(null)}
        onSelect={handleAddStep}
      />
    </div>
  );
}
