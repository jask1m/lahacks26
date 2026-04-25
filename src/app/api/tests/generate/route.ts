import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { generateTestSteps } from "@/lib/ai/generate-steps";
import { getDefaultWorkflowAuthConfig } from "@/lib/auth/workflow";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const { projectId, websiteUrl, description } = await req.json();

    if (!projectId || !websiteUrl || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate steps using AI
    const rawSteps = await generateTestSteps(
      websiteUrl,
      description,
      false
    );

    // Add IDs to each step
    const steps = rawSteps.map((step) => ({
      id: uuidv4(),
      ...step,
      ...(step.type === "auth"
        ? {
            authConfig: getDefaultWorkflowAuthConfig(step.description),
            authCredentials: null,
            credentialSource: null,
          }
        : {}),
    }));

    // Derive a short name from the description
    const name =
      description.length > 60
        ? description.substring(0, 60) + "..."
        : description;

    // Save test to database
    const { data, error } = await supabase
      .from("tests")
      .insert({
        project_id: projectId,
        name,
        description,
        steps,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ testId: data.id, test: data });
  } catch (err) {
    console.error("Failed to generate test:", err);
    return NextResponse.json(
      { error: "Failed to generate test steps" },
      { status: 500 }
    );
  }
}
