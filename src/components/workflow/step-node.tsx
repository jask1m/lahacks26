"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, ShieldCheck, KeyRound, X } from "lucide-react";
import { TestStep } from "@/lib/supabase/types";

interface StepNodeProps {
  step: TestStep;
  onEdit: (id: string, description: string) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

export function StepNode({ step, onEdit, onDelete, autoFocus }: StepNodeProps) {
  const [editing, setEditing] = useState(autoFocus ?? false);
  const [text, setText] = useState(step.description);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(step.description);
  }, [step.description]);

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  function handleSave() {
    setEditing(false);
    const trimmed = text.trim();
    if (trimmed && trimmed !== step.description) {
      onEdit(step.id, trimmed);
    } else {
      setText(step.description);
    }
  }

  const isAct = step.type === "act";
  const isAuth = step.type === "auth";

  const borderColor = isAct
    ? "border-l-accent-blue"
    : isAuth
    ? "border-l-[oklch(0.7_0.14_55)]"
    : "border-l-accent-green";

  return (
    <div
      className={`group relative bg-bg-1 border border-border rounded-lg px-[18px] py-3.5 w-full max-w-[520px] transition-colors border-l-[3px] ${borderColor} ${
        editing
          ? "border-border-highlight shadow-md"
          : "hover:border-border-highlight hover:bg-bg-2 cursor-text"
      }`}
      onClick={() => {
        if (!editing) setEditing(true);
      }}
    >
      <div className="flex items-start gap-3.5">
        <span
          className={`shrink-0 mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
            isAct
              ? "bg-accent-blue/12 text-accent-blue border-accent-blue/30"
              : isAuth
              ? "bg-[oklch(0.7_0.14_55/0.12)] text-[oklch(0.7_0.14_55)] border-[oklch(0.7_0.14_55/0.3)]"
              : "bg-accent-green/12 text-accent-green border-accent-green/30"
          }`}
        >
          {isAct ? "Act" : isAuth ? "Auth" : "Assert"}
        </span>

        {editing ? (
          <textarea
            ref={textareaRef}
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
            onClick={(e) => e.stopPropagation()}
            rows={2}
          />
        ) : (
          <span className="flex-1 text-[13.5px] leading-relaxed text-foreground">
            {step.description || "Click to add description..."}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(step.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
