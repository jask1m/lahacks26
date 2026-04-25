"use client";

import { useCallback, useState } from "react";
import { TestStep } from "@/lib/supabase/types";
import { StepNode } from "./step-node";
import { AddNodeButton } from "./add-node-button";
import { AddStepModal } from "./add-step-modal";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import { CanvasViewport } from "./canvas-viewport";
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
  return <div className="w-[1.5px] h-6 bg-canvas-connector" />;
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
  const [modalInsertIndex, setModalInsertIndex] = useState<number | null>(null);
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-bg-1">
        <div />
        <div className="flex items-center gap-2">
          {toolbarActions}
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            disabled={saving}
            className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button
            size="sm"
            onClick={onRun}
            className="bg-accent-green text-white hover:bg-[oklch(0.74_0.16_162)] shadow-[0_0_20px_oklch(0.7_0.16_162/0.25)] hover:shadow-[0_0_28px_oklch(0.7_0.16_162/0.4)] border-0"
          >
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </div>

      {/* Canvas workflow area */}
      <CanvasViewport className="flex-1 bg-bg-0">
        <div className="flex flex-col items-center py-10 px-4" data-no-pan>
          {/* Trigger */}
          <div
            className="flex items-center gap-2.5 px-[18px] py-2.5 bg-white border-dashed rounded-full font-mono text-[12px] max-w-[520px] w-full"
            style={{
              borderWidth: "1.5px",
              borderColor: "rgba(0,0,0,0.18)",
              color: "rgba(0,0,0,0.4)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M7.5 5v3M7.5 10v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {testName}
          </div>

          {/* Steps with connectors and + buttons */}
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center w-full max-w-[520px]">
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
          <div className="flex items-center gap-[7px]" style={{ color: "rgba(0,0,0,0.3)" }}>
            <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M5 7.5l2 2 3.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="text-[12.5px]">End</span>
          </div>
        </div>
      </CanvasViewport>

      {/* Add step modal */}
      <AddStepModal
        open={modalInsertIndex !== null}
        onClose={() => setModalInsertIndex(null)}
        onSelect={handleAddStep}
      />
    </div>
  );
}
