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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Project } from "@/lib/supabase/types";

interface DeleteProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onDeleted: () => void;
}

export function DeleteProjectDialog({
  open,
  onOpenChange,
  project,
  onDeleted,
}: DeleteProjectDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid =
    confirmation === project.name || confirmation === project.url;

  async function handleDelete() {
    if (!isValid) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Failed to delete project");
      }

      setConfirmation("");
      onOpenChange(false);
      onDeleted();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to delete project");
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
          <DialogTitle className="text-center">Delete Project</DialogTitle>
          <DialogDescription className="text-center">
            This will permanently delete <strong>{project.name}</strong> and all
            its tests. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="confirmation">
              Type the project name or URL to confirm
            </Label>
            <Input
              id="confirmation"
              placeholder={project.name}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
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
            disabled={loading || !isValid}
          >
            {loading ? "Deleting..." : "Delete Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
