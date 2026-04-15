import { runEventBus, RunUpdate } from "@/lib/execution/event-bus";
import { supabase } from "@/lib/supabase/client";

export const maxDuration = 300;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // First, send current state from DB
      (async () => {
        const { data: run } = await supabase
          .from("test_runs")
          .select("*")
          .eq("id", runId)
          .single();

        const { data: steps } = await supabase
          .from("test_run_steps")
          .select("*")
          .eq("test_run_id", runId)
          .order("step_index");

        if (run) {
          const cachedLiveViewUrl = runEventBus.getLiveViewUrl(runId);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "init",
                run,
                steps: steps || [],
                liveViewUrl: cachedLiveViewUrl || null,
              })}\n\n`
            )
          );

          // If already completed, close stream
          if (run.status === "passed" || run.status === "failed") {
            controller.close();
            return;
          }
        }

        // Subscribe to live updates
        const unsubscribe = runEventBus.subscribe(
          runId,
          (update: RunUpdate) => {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(update)}\n\n`)
              );

              // Close stream when run completes
              if (
                update.type === "run" &&
                (update.runStatus === "passed" || update.runStatus === "failed")
              ) {
                setTimeout(() => {
                  unsubscribe();
                  controller.close();
                }, 500);
              }
            } catch {
              unsubscribe();
            }
          }
        );

        // Clean up after 5 minutes max
        setTimeout(() => {
          unsubscribe();
          try {
            controller.close();
          } catch {}
        }, 300000);
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
