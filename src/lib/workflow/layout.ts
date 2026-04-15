import { Node, Edge } from "@xyflow/react";
import { TestStep } from "@/lib/supabase/types";

const NODE_WIDTH = 400;
const NODE_SPACING = 100;
const START_Y = 60;

export function stepsToNodesAndEdges(
  testName: string,
  steps: TestStep[]
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Title node
  nodes.push({
    id: "title",
    type: "titleNode",
    position: { x: 0, y: 0 },
    data: { label: testName },
    draggable: false,
    selectable: false,
  });

  steps.forEach((step, index) => {
    const y = START_Y + index * NODE_SPACING;
    nodes.push({
      id: step.id,
      type: step.type === "act" ? "actNode" : "assertNode",
      position: { x: 0, y },
      data: { step },
      style: { width: NODE_WIDTH },
    });

    // Edge from previous node
    const sourceId = index === 0 ? "title" : steps[index - 1].id;
    edges.push({
      id: `e-${sourceId}-${step.id}`,
      source: sourceId,
      target: step.id,
      type: "smoothstep",
    });
  });

  // End node
  if (steps.length > 0) {
    const endY = START_Y + steps.length * NODE_SPACING;
    nodes.push({
      id: "end",
      type: "endNode",
      position: { x: 0, y: endY },
      data: {},
      draggable: false,
      selectable: false,
    });
    edges.push({
      id: `e-${steps[steps.length - 1].id}-end`,
      source: steps[steps.length - 1].id,
      target: "end",
      type: "smoothstep",
    });
  }

  return { nodes, edges };
}
