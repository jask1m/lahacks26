"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, X } from "lucide-react";
import { TestStep } from "@/lib/supabase/types";
import { useState, useRef, useEffect } from "react";

interface AssertNodeData {
  step: TestStep;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, description: string) => void;
  [key: string]: unknown;
}

export function AssertNode({ data }: NodeProps) {
  const { step, onDelete, onEdit } = data as AssertNodeData;
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(step.description);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    setEditing(false);
    if (text.trim() !== step.description && onEdit) {
      onEdit(step.id, text.trim());
    }
  }

  return (
    <div className="bg-white border border-border rounded-lg px-4 py-3 shadow-sm min-w-[300px] group">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-start gap-3">
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 shrink-0 mt-0.5">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Assert
        </Badge>
        {editing ? (
          <textarea
            ref={inputRef}
            className="flex-1 text-sm border rounded px-2 py-1 resize-none"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
              if (e.key === "Escape") {
                setText(step.description);
                setEditing(false);
              }
            }}
            rows={2}
          />
        ) : (
          <span
            className="flex-1 text-sm cursor-pointer hover:text-muted-foreground"
            onDoubleClick={() => setEditing(true)}
          >
            {step.description}
          </span>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(step.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-border" />
    </div>
  );
}
