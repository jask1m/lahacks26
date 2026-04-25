"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Project, Test } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Topbar } from "@/components/dashboard/topbar";
import { CreateTestDialog } from "@/components/dashboard/create-test-dialog";
import { DeleteTestDialog } from "@/components/dashboard/delete-test-dialog";
import { getProjectExecutionModeFromString } from "@/lib/projects/url";
import { Plus, FlaskConical, Trash2, Globe, ChevronRight, Pencil } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);

  async function loadData() {
    const [{ data: proj }, { data: testData }] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase
        .from("tests")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
    ]);
    setProject(proj);
    setTests(testData || []);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (loading) return <div className="p-7 text-muted-foreground">Loading...</div>;
  if (!project) return <div className="p-7">Project not found</div>;

  const executionMode =
    project.execution_mode ?? getProjectExecutionModeFromString(project.url);

  return (
    <>
      <Topbar
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name },
        ]}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(true)}
              className="bg-transparent border-border-highlight text-muted-foreground hover:bg-bg-2 hover:text-foreground text-[13px] h-8"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              New Test
            </Button>
            <Button
              size="sm"
              className="bg-accent-blue text-white hover:bg-[oklch(0.72_0.18_255)] shadow-[0_0_20px_oklch(0.68_0.18_255/0.25)] border-0 text-[13px] h-8"
              onClick={() => {
                if (tests.length > 0) {
                  router.push(`/dashboard/projects/${projectId}/tests/${tests[0].id}`);
                }
              }}
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              Open Editor
            </Button>
          </>
        }
      />

      {/* Project Hero */}
      <div className="bg-bg-1 border-b border-border px-7 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-gradient-to-br from-bg-3 to-bg-2 border border-border-highlight rounded-xl flex items-center justify-center">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-heading text-xl font-bold tracking-tight">
                {project.name}
              </span>
              <span
                className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${
                  executionMode === "local"
                    ? "bg-[oklch(0.55_0.1_55/0.15)] text-[oklch(0.72_0.12_55)] border-[oklch(0.55_0.1_55/0.25)]"
                    : "bg-[oklch(0.55_0.1_250/0.15)] text-[oklch(0.72_0.12_250)] border-[oklch(0.55_0.1_250/0.25)]"
                }`}
              >
                {executionMode === "local" ? "Local" : "Hosted"}
              </span>
            </div>
            <div className="text-xs font-mono text-text-tertiary mt-0.5">
              {project.url}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-right">
            <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Tests</div>
            <div className="text-lg font-heading font-bold">{tests.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Pass Rate</div>
            <div className="text-lg font-heading font-bold text-accent-green">--</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Last Run</div>
            <div className="text-lg font-heading font-bold">--</div>
          </div>
        </div>
      </div>

      {/* Test list */}
      <div className="p-7 flex-1">
        <div className="text-[11px] font-semibold tracking-wider uppercase text-text-tertiary mb-2.5">
          Test Suites
        </div>

        {tests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-bg-2 p-4 mb-4">
              <FlaskConical className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No tests yet</h2>
            <p className="text-muted-foreground mb-4">
              Describe a test and we&apos;ll generate the steps for you
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-accent-blue text-white hover:bg-[oklch(0.72_0.18_255)] border-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Test
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {tests.map((test) => (
              <div
                key={test.id}
                className="bg-bg-1 border border-border rounded-lg px-5 py-4 flex items-center gap-4 cursor-pointer transition-all hover:bg-bg-2 hover:border-border-highlight hover:shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
                onClick={() =>
                  router.push(
                    `/dashboard/projects/${projectId}/tests/${test.id}`
                  )
                }
              >
                <div className="w-[34px] h-[34px] bg-bg-3 rounded-lg flex items-center justify-center shrink-0">
                  <FlaskConical className="h-4 w-4 text-text-tertiary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-foreground truncate">
                    {test.name}
                  </div>
                  <div className="text-xs text-text-tertiary mt-0.5">
                    {test.steps.length} steps
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTestToDelete(test);
                  }}
                  className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-3.5 w-3.5 text-text-tertiary shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        websiteUrl={project.url}
        onCreated={(testId) => {
          router.push(`/dashboard/projects/${projectId}/tests/${testId}`);
        }}
      />

      {testToDelete && (
        <DeleteTestDialog
          open={!!testToDelete}
          onOpenChange={(open) => !open && setTestToDelete(null)}
          test={testToDelete}
          onDeleted={() => {
            setTestToDelete(null);
            loadData();
          }}
        />
      )}
    </>
  );
}
