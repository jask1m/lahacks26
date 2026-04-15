"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { CheckCircle2 } from "lucide-react";

export function EndNode(_props: NodeProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <CheckCircle2 className="h-4 w-4 text-green-600" />
      <span className="text-sm text-muted-foreground">End</span>
    </div>
  );
}
