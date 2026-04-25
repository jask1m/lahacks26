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
      <div className="flex items-center justify-center h-full bg-bg-2">
        <div className="text-center max-w-sm px-6">
          <div className="w-12 h-12 rounded-xl bg-bg-3 border border-border-highlight flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="text-[13px] font-medium text-foreground mb-1">Local execution mode</div>
          <p className="text-[12px] text-text-tertiary">
            This run is using a local Playwright browser, so Browserbase live view is not available.
          </p>
        </div>
      </div>
    );
  }

  if (!liveViewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-bg-2">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-bg-3 border border-border-highlight flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-text-tertiary">
              <rect x="2" y="3" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-[13px] text-foreground mb-1">Starting browser session...</p>
          <p className="text-[12px] text-text-tertiary">Live view will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-[10px] px-[14px] h-[44px] bg-bg-1 border-b border-border shrink-0">
        <div className="flex gap-[5px] shrink-0">
          <div className="w-[10px] h-[10px] rounded-full bg-[#ff5f57]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#febc2e]" />
          <div className="w-[10px] h-[10px] rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-bg-3 border border-border-highlight rounded-md px-2.5 py-[5px] text-[11px] font-mono text-muted-foreground truncate flex items-center gap-[7px] min-w-0">
          <span className="opacity-35 shrink-0">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <rect x="2" y="5.5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4 5.5V3.5a2 2 0 0 1 4 0v2" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </span>
          <span className="overflow-hidden whitespace-nowrap text-ellipsis">{liveViewUrl}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className="w-[26px] h-[26px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-bg-2 hover:text-muted-foreground transition-colors"
            title="Refresh"
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M2 7.5A5.5 5.5 0 0 1 13 5M13 7.5A5.5 5.5 0 0 1 2 10M13 3v2h-2M2 10v2h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button
            className="w-[26px] h-[26px] flex items-center justify-center rounded-[5px] text-text-tertiary hover:bg-bg-2 hover:text-muted-foreground transition-colors"
            title="Open in new tab"
            onClick={() => window.open(liveViewUrl, "_blank")}
          >
            <svg width="12" height="12" viewBox="0 0 15 15" fill="none">
              <path d="M9 2h4v4M13 2l-6 6M6 4H3v8h8v-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      {/* Browser body */}
      <div className="flex-1 bg-[#f7f7fb]">
        <iframe
          src={liveViewUrl}
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
