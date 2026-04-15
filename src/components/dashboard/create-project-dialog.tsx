"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateProjectDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  function deriveNameFromUrl(url: string): string {
    try {
      const hostname = new URL(
        url.startsWith("http") ? url : `https://${url}`
      ).hostname;
      return hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const name = deriveNameFromUrl(url);

    const { error } = await supabase
      .from("projects")
      .insert({ name, url: normalizedUrl });

    setLoading(false);
    if (!error) {
      setUrl("");
      onOpenChange(false);
      onCreated();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-muted p-3">
              <Globe className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <DialogTitle className="text-center">
            What do you want to test?
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter your website URL and we&apos;ll set up the project for you.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="url">Website URL</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                placeholder="example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
