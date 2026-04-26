import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const cookieStore = await cookies();
  const settings = cookieStore.get("compute-settings");

  if (settings) {
    try {
      return NextResponse.json(JSON.parse(settings.value));
    } catch {
      // Invalid JSON, return defaults
    }
  }

  return NextResponse.json({ model: "gemma", cloudCompute: false });
}

export async function POST(request: Request) {
  const body = await request.json();
  const cookieStore = await cookies();

  cookieStore.set("compute-settings", JSON.stringify(body), {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });

  return NextResponse.json({ success: true });
}
