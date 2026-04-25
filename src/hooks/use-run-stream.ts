"use client";

import { useEffect, useState } from "react";
import { TestRunStep } from "@/lib/supabase/types";

interface RunStreamState {
  steps: TestRunStep[];
  runStatus: "pending" | "running" | "passed" | "failed";
  liveViewUrl: string | null;
  connected: boolean;
}

export function useRunStream(runId: string) {
  const [state, setState] = useState<RunStreamState>({
    steps: [],
    runStatus: "pending",
    liveViewUrl: null,
    connected: false,
  });

  useEffect(() => {
    const eventSource = new EventSource(`/api/test-runs/${runId}/stream`);

    eventSource.onopen = () => {
      setState((prev) => ({ ...prev, connected: true }));
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          setState((prev) => ({
            ...prev,
            steps: data.steps || [],
            runStatus: data.run?.status || "pending",
            liveViewUrl: data.liveViewUrl || prev.liveViewUrl,
          }));
          return;
        }

        if (data.type === "run") {
          setState((prev) => ({
            ...prev,
            runStatus: data.runStatus || prev.runStatus,
            liveViewUrl: data.liveViewUrl || prev.liveViewUrl,
          }));
          return;
        }

        if (data.type === "step" && data.stepUpdate) {
          const { stepIndex, status, screenshotUrl, details } = data.stepUpdate;
          setState((prev) => {
            const newSteps = [...prev.steps];
            if (newSteps[stepIndex]) {
              newSteps[stepIndex] = {
                ...newSteps[stepIndex],
                status,
                screenshot_url: screenshotUrl || newSteps[stepIndex].screenshot_url,
                details: details || newSteps[stepIndex].details,
              };
            }
            return { ...prev, steps: newSteps };
          });
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    eventSource.onerror = () => {
      setState((prev) => ({ ...prev, connected: false }));
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [runId]);

  return state;
}
