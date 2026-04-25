"use client";

import Link from "next/link";
import { Project } from "@/lib/supabase/types";
import { getProjectExecutionModeFromString } from "@/lib/projects/url";
import { Globe, Trash2, ChevronRight } from "lucide-react";

interface ProjectCardProps {
  project: Project;
  onDelete?: (project: Project) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const executionMode =
    project.execution_mode ?? getProjectExecutionModeFromString(project.url);

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="bg-bg-1 border border-border rounded-lg px-[18px] py-4 flex items-center gap-3.5 cursor-pointer transition-all hover:bg-bg-2 hover:border-border-highlight hover:-translate-y-px hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] group">
        {/* Icon */}
        <div className="w-9 h-9 bg-bg-3 rounded-lg border border-border flex items-center justify-center shrink-0">
          <Globe className="h-[15px] w-[15px] text-text-tertiary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-heading font-semibold text-foreground truncate">
            {project.name}
          </div>
          <div className="text-[11.5px] font-mono text-text-tertiary mt-0.5 truncate">
            {project.url}
          </div>
        </div>

        {/* Badge */}
        <span
          className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap border ${
            executionMode === "local"
              ? "bg-[oklch(0.55_0.1_55/0.15)] text-[oklch(0.72_0.12_55)] border-[oklch(0.55_0.1_55/0.25)]"
              : "bg-[oklch(0.55_0.1_250/0.15)] text-[oklch(0.72_0.12_250)] border-[oklch(0.55_0.1_250/0.25)]"
          }`}
        >
          {executionMode === "local" ? "Local" : "Hosted"}
        </span>

        {/* Delete */}
        {onDelete && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDelete(project);
            }}
            className="p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
      </div>
    </Link>
  );
}
