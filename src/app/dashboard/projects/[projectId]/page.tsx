"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Project, Test } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateTestDialog } from "@/components/dashboard/create-test-dialog";
import { getProjectExecutionModeFromString } from "@/lib/projects/url";
import { ArrowLeft, Plus, FlaskConical } from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

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

  if (loading) return <div className="p-6 text-muted-foreground">Loading...</div>;
  if (!project) return <div className="p-6">Project not found</div>;

  const executionMode =
    project.execution_mode ?? getProjectExecutionModeFromString(project.url);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to projects
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <Badge variant="secondary">
                {executionMode === "local" ? "Local" : "Hosted"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm">{project.url}</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <FlaskConical className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-1">No tests yet</h2>
          <p className="text-muted-foreground mb-4">
            Describe a test and we&apos;ll generate the steps for you
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Test
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((test) => (
            <Card
              key={test.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                router.push(
                  `/dashboard/projects/${projectId}/tests/${test.id}`
                )
              }
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FlaskConical className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{test.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {test.steps.length} steps
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {test.steps.map((step) => (
                    <Badge
                      key={step.id}
                      variant={step.type === "act" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {step.type}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateTestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        websiteUrl={project.url}
        onCreated={(testId) => {
          router.push(`/dashboard/projects/${projectId}/tests/${testId}`);
        }}
      />
    </div>
  );
}
