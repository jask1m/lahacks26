"use client";

import type { ProjectExecutionMode } from "@/lib/projects/url";

export function BrowserEmbed({
  liveViewUrl,
  executionMode,
}: {
  liveViewUrl: string | null;
  executionMode: ProjectExecutionMode;
}) {
  if (executionMode === "local") {
    return (
      <div className="flex items-center justify-center h-full bg-bg-1 rounded-lg border border-border">
        <div className="text-center text-muted-foreground max-w-sm px-6">
          <div className="mb-2 font-medium text-foreground">Local execution mode</div>
          <p className="text-sm">
            This run is using a local Playwright browser, so Browserbase live
            view is not available.
          </p>
        </div>
      </div>
    );
  }

  if (!liveViewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-1 rounded-lg border border-border">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse mb-2">Starting browser session...</div>
          <p className="text-sm">The live browser view will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-bg-1 border-b border-border">
        <div className="flex gap-1.5">
          <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-bg-3 border border-border rounded-md px-2.5 py-1 text-xs font-mono text-muted-foreground truncate">
          {liveViewUrl}
        </div>
      </div>
      {/* Browser body */}
      <div className="flex-1 bg-[#f8f8f8]">
        <iframe
          src={liveViewUrl}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
