"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
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

  return (
    <div
      className={`group relative bg-white border rounded-lg px-4 py-3 w-full max-w-[460px] transition-colors ${
        editing
          ? "border-gray-400 shadow-md"
          : "border-border hover:border-gray-400 hover:shadow-sm cursor-text"
      }`}
      onClick={() => {
        if (!editing) setEditing(true);
      }}
    >
      <div className="flex items-start gap-3">
        <Badge
          className={`shrink-0 mt-0.5 ${
            isAct
              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-100"
              : isAuth
              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
              : "bg-green-100 text-green-700 hover:bg-green-100"
          }`}
        >
          {isAct ? (
            <Sparkles className="h-3 w-3 mr-1" />
          ) : isAuth ? (
            <KeyRound className="h-3 w-3 mr-1" />
          ) : (
            <ShieldCheck className="h-3 w-3 mr-1" />
          )}
          {isAct ? "Act" : isAuth ? "Auth" : "Assert"}
        </Badge>

        {editing ? (
          <textarea
            ref={textareaRef}
            className="flex-1 text-sm border rounded px-2 py-1 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
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
          <span className="flex-1 text-sm leading-relaxed">
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
