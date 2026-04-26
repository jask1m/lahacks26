"use client";

import { useState, useRef, useEffect } from "react";
import { TestStep } from "@/lib/supabase/types";

interface StepNodeProps {
  step: TestStep;
  onEdit: (id: string, description: string) => void;
  onDelete: (id: string) => void;
  autoFocus?: boolean;
}

const BADGE_STYLES = {
  act: "bg-[oklch(0.68_0.18_255/0.1)] text-[oklch(0.5_0.2_255)] border-[oklch(0.68_0.18_255/0.22)]",
  assert: "bg-[oklch(0.7_0.16_162/0.1)] text-[oklch(0.44_0.15_162)] border-[oklch(0.7_0.16_162/0.22)]",
  auth: "bg-[oklch(0.7_0.14_55/0.1)] text-[oklch(0.48_0.14_55)] border-[oklch(0.7_0.14_55/0.22)]",
} as const;

const BAR_COLORS = {
  act: "bg-accent-blue",
  assert: "bg-accent-green",
  auth: "bg-[oklch(0.7_0.14_55)]",
} as const;

const BADGE_LABELS = { act: "Act", assert: "Assert", auth: "Auth" } as const;

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

  return (
    <div
      className={`group relative bg-white rounded-[10px] w-[260px] transition-all cursor-text ${
        editing
          ? "border-[oklch(0.68_0.18_255/0.4)] shadow-[0_0_0_3px_oklch(0.68_0.18_255/0.08),0_4px_16px_rgba(0,0,0,0.1)]"
          : "border-canvas-border hover:border-canvas-border-hover shadow-[0_1px_3px_rgba(0,0,0,0.07),0_4px_12px_rgba(0,0,0,0.05)] hover:shadow-[0_2px_8px_rgba(0,0,0,0.1),0_8px_24px_rgba(0,0,0,0.08)]"
      }`}
      style={{
        border: editing
          ? "1px solid oklch(0.68 0.18 255 / 0.4)"
          : "1px solid rgba(0,0,0,0.09)",
        padding: "13px 15px",
      }}
      onClick={() => {
        if (!editing) setEditing(true);
      }}
    >
      <div className="flex items-start gap-[11px]">
        {/* Left color bar */}
        <div
          className={`w-[3px] rounded-sm self-stretch min-h-[20px] shrink-0 ${BAR_COLORS[step.type]}`}
        />

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Type badge */}
          <span
            className={`inline-flex items-center gap-1 text-[9.5px] font-semibold px-[7px] py-[2px] rounded-full border mb-1.5 ${BADGE_STYLES[step.type]}`}
            style={{ letterSpacing: "0.03em" }}
          >
            {BADGE_LABELS[step.type]}
          </span>

          {editing ? (
            <textarea
              ref={textareaRef}
              className="w-full text-[13px] leading-relaxed rounded-md px-2 py-1.5 resize-none outline-none"
              style={{
                background: "#f3f3f8",
                border: "1px solid oklch(0.68 0.18 255 / 0.3)",
                color: "#1a1a2e",
                fontFamily: "var(--font-inter), Inter, sans-serif",
              }}
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
            <div className="text-[13px] leading-[1.55]" style={{ color: step.description ? "#1a1a2e" : "rgba(0,0,0,0.3)" }}>
              {step.description ? (
                step.description
              ) : (
                <span className="italic">Click to add description...</span>
              )}
            </div>
          )}
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(step.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 rounded p-0.5"
          style={{ color: "rgba(0,0,0,0.22)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "oklch(0.577 0.245 27)";
            e.currentTarget.style.background = "oklch(0.577 0.245 27 / 0.08)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(0,0,0,0.22)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
            <path d="M3 3l9 9M12 3l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
