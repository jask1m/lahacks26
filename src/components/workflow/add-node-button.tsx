"use client";

import { Plus } from "lucide-react";

interface AddNodeButtonProps {
  onClick: () => void;
}

export function AddNodeButton({ onClick }: AddNodeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-7 w-7 rounded-full border bg-white text-muted-foreground hover:text-foreground hover:border-foreground hover:shadow-sm transition-all"
    >
      <Plus className="h-3.5 w-3.5" />
    </button>
  );
}
