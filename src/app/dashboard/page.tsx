"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Project } from "@/lib/supabase/types";
import { ProjectCard } from "@/components/dashboard/project-card";
import { CreateProjectDialog } from "@/components/dashboard/create-project-dialog";
import { DeleteProjectDialog } from "@/components/dashboard/delete-project-dialog";
import { Topbar } from "@/components/dashboard/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProjects() {
      const { data } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      setProjects(data || []);
      setLoading(false);
    }

    void loadProjects();

    return () => {
      active = false;
    };
  }, []);

  async function loadProjects() {
    const { data } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });
    setProjects(data || []);
    setLoading(false);
  }

  return (
    <>
      <Topbar
        breadcrumbs={[{ label: "Projects" }]}
        actions={
          <>
            <div className="flex items-center gap-2 bg-bg-1 border border-border rounded-md px-3 py-1.5 w-[220px] focus-within:border-accent-blue/30 focus-within:shadow-[0_0_0_2px_oklch(0.68_0.18_255/0.12)] transition-all">
              <Search className="h-[13px] w-[13px] text-text-tertiary" />
              <input
                type="text"
                placeholder="Search projects..."
                className="bg-transparent border-none outline-none text-[13px] text-foreground w-full placeholder:text-text-tertiary"
              />
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-accent-blue text-white hover:bg-[oklch(0.72_0.18_255)] shadow-[0_0_20px_oklch(0.68_0.18_255/0.25)] hover:shadow-[0_0_28px_oklch(0.68_0.18_255/0.4)] border-0 text-[13px] font-medium h-8 px-3.5"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              New Project
            </Button>
          </>
        }
      />

      <div className="p-7 flex-1">
        {/* Stat strip */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          <StatCard label="Total Projects" value={projects.length} delta={`${projects.length} total`} />
          <StatCard label="Total Tests" value="--" />
          <StatCard label="Pass Rate" value="--" valueClassName="text-accent-green" />
          <StatCard label="Last Run" value="--" />
        </div>

        {/* All Projects */}
        <div className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary mb-2.5">
          All Projects
        </div>

        {loading ? (
          <div className="text-muted-foreground text-sm">Loading...</div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-bg-2 p-4 mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No projects yet</h2>
            <p className="text-muted-foreground mb-4">
              Create your first project to start testing
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-accent-blue text-white hover:bg-[oklch(0.72_0.18_255)] border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={setProjectToDelete}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={loadProjects}
      />

      {projectToDelete && (
        <DeleteProjectDialog
          open={!!projectToDelete}
          onOpenChange={(open) => !open && setProjectToDelete(null)}
          project={projectToDelete}
          onDeleted={() => {
            setProjectToDelete(null);
            loadProjects();
          }}
        />
      )}
    </>
  );
}
