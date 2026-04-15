"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

interface AddNodeButtonProps {
  onAdd: (type: "act" | "assert", description: string) => void;
}

export function AddNodeButton({ onAdd }: AddNodeButtonProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"act" | "assert">("act");
  const [description, setDescription] = useState("");

  function handleSubmit() {
    if (!description.trim()) return;
    onAdd(type, description.trim());
    setDescription("");
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center justify-center h-6 w-6 rounded-full border bg-white text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
      >
        <Plus className="h-3 w-3" />
      </button>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-3 shadow-lg w-[340px]">
      <div className="flex gap-2 mb-2">
        <Badge
          className={`cursor-pointer ${
            type === "act"
              ? "bg-indigo-100 text-indigo-700"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setType("act")}
        >
          Act
        </Badge>
        <Badge
          className={`cursor-pointer ${
            type === "assert"
              ? "bg-green-100 text-green-700"
              : "bg-muted text-muted-foreground"
          }`}
          onClick={() => setType("assert")}
        >
          Assert
        </Badge>
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Step description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") setOpen(false);
          }}
          autoFocus
          className="text-sm"
        />
        <Button size="sm" onClick={handleSubmit} disabled={!description.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
