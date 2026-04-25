import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { COMPILE_VERSION } from "@/lib/ai/generate-steps";
import type { TestStep } from "@/lib/supabase/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const { data, error } = await supabase
    .from("tests")
    .select("*")
    .eq("id", testId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const body = await req.json();
  const { data: existingTest, error: existingError } = await supabase
    .from("tests")
    .select("steps")
    .eq("id", testId)
    .single<{ steps: TestStep[] }>();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  const existingSteps = existingTest?.steps ?? [];
  const incomingSteps = Array.isArray(body.steps) ? (body.steps as TestStep[]) : [];
  const existingStepsById = new Map(existingSteps.map((step) => [step.id, step]));
  const existingAuthStep = existingSteps.find((step) => step.type === "auth");
  const normalizedSteps = incomingSteps.map((step, index) => {
    const previousStep = existingStepsById.get(step.id) ?? existingSteps[index];
    const isNewStep = !previousStep || previousStep.id !== step.id;
    const stepChanged =
      isNewStep ||
      previousStep.description !== step.description ||
      previousStep.type !== step.type;

    if (step.type === "auth") {
      return {
        ...step,
        authConfig: step.authConfig ?? existingAuthStep?.authConfig,
        authCredentials:
          step.authCredentials ?? existingAuthStep?.authCredentials ?? null,
        credentialSource:
          step.credentialSource ?? existingAuthStep?.credentialSource ?? null,
        compiledActions: undefined,
        compileStatus: "compiled" as const,
        compileVersion: COMPILE_VERSION,
        compileNotes: "Auth steps use the configured auth executor.",
        fallbackPolicy: "none" as const,
      };
    }

    if (stepChanged) {
      return {
        ...step,
        compiledActions: undefined,
        compileStatus: "pending" as const,
        compileVersion: COMPILE_VERSION,
        compileNotes: "Step changed and will be recompiled on the next run.",
        fallbackPolicy: "llm_on_failure" as const,
      };
    }

    return {
      ...step,
      compileStatus:
        step.compileStatus ?? (step.compiledActions?.length ? "compiled" : "pending"),
      compileVersion: step.compileVersion ?? COMPILE_VERSION,
      fallbackPolicy: step.fallbackPolicy ?? "llm_on_failure",
    };
  });

  const { data, error } = await supabase
    .from("tests")
    .update({ steps: normalizedSteps, name: body.name })
    .eq("id", testId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ testId: string }> }
) {
  const { testId } = await params;
  const { error } = await supabase.from("tests").delete().eq("id", testId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
