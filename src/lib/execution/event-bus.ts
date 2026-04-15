export interface StepUpdate {
  stepIndex: number;
  status: "running" | "passed" | "failed" | "skipped";
  screenshotUrl?: string;
  details?: string;
}

export interface RunUpdate {
  type: "step" | "run";
  stepUpdate?: StepUpdate;
  runStatus?: "running" | "passed" | "failed";
  liveViewUrl?: string;
}

type Listener = (update: RunUpdate) => void;

class RunEventBus {
  private listeners = new Map<string, Set<Listener>>();
  private liveViewUrls = new Map<string, string>();

  subscribe(runId: string, listener: Listener): () => void {
    if (!this.listeners.has(runId)) {
      this.listeners.set(runId, new Set());
    }
    this.listeners.get(runId)!.add(listener);

    return () => {
      this.listeners.get(runId)?.delete(listener);
      if (this.listeners.get(runId)?.size === 0) {
        this.listeners.delete(runId);
        this.liveViewUrls.delete(runId);
      }
    };
  }

  emit(runId: string, update: RunUpdate) {
    if (update.liveViewUrl) {
      this.liveViewUrls.set(runId, update.liveViewUrl);
    }
    this.listeners.get(runId)?.forEach((listener) => listener(update));
  }

  getLiveViewUrl(runId: string): string | undefined {
    return this.liveViewUrls.get(runId);
  }
}

export const runEventBus = new RunEventBus();
