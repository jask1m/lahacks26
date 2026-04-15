import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { executeTestRun } from "@/lib/execution/engine";
import { Test } from "@/lib/supabase/types";

export const maxDuration = 300;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;

  // Fetch the test
  const { data: test, error: testError } = await supabase
    .from("tests")
    .select("*, projects(*)")
    .eq("id", testId)
    .single();

  if (testError || !test) {
    return NextResponse.json({ error: "Test not found" }, { status: 404 });
  }

  // Create a test run
  const { data: run, error: runError } = await supabase
    .from("test_runs")
    .insert({ test_id: testId, status: "pending" })
    .select()
    .single();

  if (runError || !run) {
    return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
  }

  // Create step records
  const stepRecords = test.steps.map((_: unknown, index: number) => ({
    test_run_id: run.id,
    step_index: index,
    status: "pending",
  }));

  await supabase.from("test_run_steps").insert(stepRecords);

  // Fire and forget — start execution in background
  const testWithUrl: Test & { projects: { url: string } } = test;
  executeTestRun(run.id, {
    ...test,
    // Ensure the engine has the website URL
    url: testWithUrl.projects?.url,
  } as any).catch((err) => console.error("Execution error:", err));

  return NextResponse.json({ runId: run.id });
}
