"use client";

import { useCallback, useMemo, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { TestStep } from "@/lib/supabase/types";
import { ActNode } from "./act-node";
import { AssertNode } from "./assert-node";
import { TitleNode } from "./title-node";
import { EndNode } from "./end-node";
import { AddNodeButton } from "./add-node-button";
import { Button } from "@/components/ui/button";
import { Play, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Stable nodeTypes — never changes, so React Flow won't remount nodes
const nodeTypes = {
  actNode: ActNode,
  assertNode: AssertNode,
  titleNode: TitleNode,
  endNode: EndNode,
};

interface WorkflowEditorProps {
  testName: string;
  steps: TestStep[];
  onStepsChange: (steps: TestStep[]) => void;
  onSave: () => void;
  onRun: () => void;
  saving?: boolean;
}

const NODE_SPACING = 100;
const START_Y = 60;

export function WorkflowEditor({
  testName,
  steps,
  onStepsChange,
  onSave,
  onRun,
  saving,
}: WorkflowEditorProps) {
  // Use refs so callbacks always see latest steps without causing nodeTypes to change
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const onStepsChangeRef = useRef(onStepsChange);
  onStepsChangeRef.current = onStepsChange;

  const handleDelete = useCallback((id: string) => {
    onStepsChangeRef.current(stepsRef.current.filter((s) => s.id !== id));
  }, []);

  const handleEdit = useCallback((id: string, description: string) => {
    onStepsChangeRef.current(
      stepsRef.current.map((s) => (s.id === id ? { ...s, description } : s))
    );
  }, []);

  const handleAddNode = useCallback(
    (afterIndex: number, type: "act" | "assert", description: string) => {
      const newStep: TestStep = { id: uuidv4(), type, description };
      const newSteps = [...stepsRef.current];
      newSteps.splice(afterIndex + 1, 0, newStep);
      onStepsChangeRef.current(newSteps);
    },
    []
  );

  // Build nodes and edges with callbacks baked into data
  const { nodes, edges } = useMemo(() => {
    const n: Node[] = [];
    const e: Edge[] = [];

    n.push({
      id: "title",
      type: "titleNode",
      position: { x: 0, y: 0 },
      data: { label: testName },
      draggable: false,
      selectable: false,
    });

    steps.forEach((step, index) => {
      const y = START_Y + index * NODE_SPACING;
      n.push({
        id: step.id,
        type: step.type === "act" ? "actNode" : "assertNode",
        position: { x: 0, y },
        data: { step, onDelete: handleDelete, onEdit: handleEdit },
        style: { width: 400 },
      });

      const sourceId = index === 0 ? "title" : steps[index - 1].id;
      e.push({
        id: `e-${sourceId}-${step.id}`,
        source: sourceId,
        target: step.id,
        type: "smoothstep",
      });
    });

    if (steps.length > 0) {
      const endY = START_Y + steps.length * NODE_SPACING;
      n.push({
        id: "end",
        type: "endNode",
        position: { x: 0, y: endY },
        data: {},
        draggable: false,
        selectable: false,
      });
      e.push({
        id: `e-${steps[steps.length - 1].id}-end`,
        source: steps[steps.length - 1].id,
        target: "end",
        type: "smoothstep",
      });
    }

    return { nodes: n, edges: e };
  }, [testName, steps, handleDelete, handleEdit]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-white">
        <div />
        <div className="flex items-center gap-2">
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
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          minZoom={0.3}
          maxZoom={1.5}
        >
          <Background />
          <Controls />
        </ReactFlow>
        {/* Add node buttons overlaid between nodes */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="flex flex-col items-center" style={{ paddingTop: 45 }}>
            {steps.map((_, index) => (
              <div
                key={`add-${index}`}
                className="pointer-events-auto"
                style={{ marginTop: index === 0 ? 0 : 56 }}
              >
                <AddNodeButton
                  onAdd={(type, description) =>
                    handleAddNode(index - 1, type, description)
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
