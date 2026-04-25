import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { normalizeProjectUrl } from "@/lib/projects/url";

export async function GET() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const normalizedProject = normalizeProjectUrl(url);

    let { data, error } = await supabase
      .from("projects")
      .insert({
        name: normalizedProject.name,
        url: normalizedProject.url,
        execution_mode: normalizedProject.executionMode,
      })
      .select()
      .single();

    // Backward compatibility for databases that have not applied the
    // execution_mode migration yet.
    if (
      error?.message?.includes("execution_mode") ||
      error?.message?.includes("schema cache")
    ) {
      const retry = await supabase
        .from("projects")
        .insert({
          name: normalizedProject.name,
          url: normalizedProject.url,
        })
        .select()
        .single();

      data = retry.data;
      error = retry.error;
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Invalid project URL";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
