"use client";

import { Plus } from "lucide-react";

interface AddNodeButtonProps {
  onClick: () => void;
}

export function AddNodeButton({ onClick }: AddNodeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-6 w-6 rounded-full border border-border-highlight bg-bg-2 text-text-tertiary hover:text-foreground hover:border-accent-blue hover:shadow-[0_0_12px_oklch(0.68_0.18_255/0.12)] transition-all"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}
