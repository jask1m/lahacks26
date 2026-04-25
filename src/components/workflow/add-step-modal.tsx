"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, ShieldCheck, KeyRound } from "lucide-react";

interface AddStepModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: "act" | "assert" | "auth") => void;
}

export function AddStepModal({ open, onClose, onSelect }: AddStepModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => onSelect("act")}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-accent-blue/30 hover:bg-accent-blue/10"
          >
            <Sparkles className="h-4 w-4 text-accent-blue" />
            <span className="font-medium text-sm text-foreground">Act</span>
          </button>
          <button
            onClick={() => onSelect("assert")}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-accent-green/30 hover:bg-accent-green/10"
          >
            <ShieldCheck className="h-4 w-4 text-accent-green" />
            <span className="font-medium text-sm text-foreground">Assert</span>
          </button>
          <button
            onClick={() => onSelect("auth")}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-[oklch(0.7_0.14_55/0.3)] hover:bg-[oklch(0.7_0.14_55/0.1)]"
          >
            <KeyRound className="h-4 w-4 text-[oklch(0.7_0.14_55)]" />
            <span className="font-medium text-sm text-foreground">Auth</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
