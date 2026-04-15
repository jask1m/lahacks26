import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

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

  const { data, error } = await supabase
    .from("tests")
    .update({ steps: body.steps, name: body.name })
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
