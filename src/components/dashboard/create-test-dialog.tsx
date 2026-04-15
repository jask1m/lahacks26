"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface CreateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  websiteUrl: string;
  onCreated: (testId: string) => void;
}

export function CreateTestDialog({
  open,
  onOpenChange,
  projectId,
  websiteUrl,
  onCreated,
}: CreateTestDialogProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    if (!description.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/tests/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, websiteUrl, description }),
      });

      if (!res.ok) throw new Error("Failed to generate test");

      const { testId } = await res.json();
      setDescription("");
      onOpenChange(false);
      onCreated(testId);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>What do you want to test?</DialogTitle>
          <DialogDescription>
            Describe a user flow and we&apos;ll generate test steps
            automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <Textarea
            placeholder="Validate that on the contact page there is a link to Twitter, LinkedIn, and an email."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setDescription(
                  "Validate that on the contact page there is a link to Twitter, LinkedIn, and an email."
                );
              }}
            >
              Generate Example Test
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading || !description.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
