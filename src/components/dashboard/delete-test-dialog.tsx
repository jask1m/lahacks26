"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Test } from "@/lib/supabase/types";

interface DeleteTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  test: Test;
  onDeleted: () => void;
}

export function DeleteTestDialog({
  open,
  onOpenChange,
  test,
  onDeleted,
}: DeleteTestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/tests/${test.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Failed to delete test");
      }

      onOpenChange(false);
      onDeleted();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete test");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-red-100 p-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-center">Delete Test</DialogTitle>
          <DialogDescription className="text-center">
            Are you sure you want to delete <strong>{test.name}</strong>? This
            will also delete all test runs and cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Delete Test"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
