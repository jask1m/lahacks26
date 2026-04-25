"use client";

import Link from "next/link";
import { Project } from "@/lib/supabase/types";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getProjectExecutionModeFromString } from "@/lib/projects/url";
import { Globe } from "lucide-react";

export function ProjectCard({ project }: { project: Project }) {
  const executionMode =
    project.execution_mode ?? getProjectExecutionModeFromString(project.url);

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Globe className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base truncate">{project.name}</CardTitle>
                <Badge variant="secondary">
                  {executionMode === "local" ? "Local" : "Hosted"}
                </Badge>
              </div>
              <CardDescription className="truncate">{project.url}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}
