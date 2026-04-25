"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sparkles, ShieldCheck, Plus } from "lucide-react";

interface AddStepModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (type: "act" | "assert") => void;
}

export function AddStepModal({ open, onClose, onSelect }: AddStepModalProps) {
  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Step</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => onSelect("act")}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <span className="font-medium text-sm">Act</span>
          </button>
          <button
            onClick={() => onSelect("assert")}
            className="flex items-center gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-green-300 hover:bg-green-50/50"
          >
            <Plus className="h-4 w-4 text-muted-foreground" />
            <ShieldCheck className="h-4 w-4 text-green-600" />
            <span className="font-medium text-sm">Assert</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
