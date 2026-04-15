import { supabase } from "@/lib/supabase/client";

export async function uploadScreenshot(
  runId: string,
  stepIndex: number,
  screenshotBuffer: Buffer
): Promise<string | null> {
  const path = `runs/${runId}/step-${stepIndex}.png`;

  const { error } = await supabase.storage
    .from("screenshots")
    .upload(path, screenshotBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (error) {
    console.error("Screenshot upload failed:", error);
    return null;
  }

  const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
  return data.publicUrl;
}
