"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { X } from "lucide-react";
import { TestStep } from "@/lib/supabase/types";
import { useEffect, useRef, useState } from "react";

interface AuthNodeData {
  step: TestStep;
  onDelete?: (id: string) => void;
  onEdit?: (id: string, description: string) => void;
  [key: string]: unknown;
}

export function AuthNode({ data }: NodeProps) {
  const { step, onDelete, onEdit } = data as AuthNodeData;
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
    <div className="bg-bg-1 border border-border border-l-[3px] border-l-[oklch(0.7_0.14_55)] rounded-lg px-4 py-3 min-w-[300px] group transition-colors hover:bg-bg-2 hover:border-border-highlight">
      <Handle type="target" position={Position.Top} className="!bg-border" />
      <div className="flex items-start gap-3">
        <span className="shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[oklch(0.7_0.14_55/0.12)] text-[oklch(0.7_0.14_55)] border-[oklch(0.7_0.14_55/0.3)]">
          Auth
        </span>
        {editing ? (
          <textarea
            ref={inputRef}
            className="flex-1 text-[13.5px] bg-bg-2 border border-border-highlight rounded px-2 py-1 resize-none text-foreground focus:outline-none focus:ring-1 focus:ring-accent-blue/30"
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
            className="flex-1 text-[13.5px] text-foreground cursor-pointer hover:text-muted-foreground"
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
