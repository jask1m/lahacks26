"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Sparkles } from "lucide-react";

export function TitleNode({ data }: NodeProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2">
      <Sparkles className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium text-muted-foreground">
        {(data as { label: string }).label}
      </span>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}
