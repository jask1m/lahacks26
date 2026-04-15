"use client";

export function BrowserEmbed({ liveViewUrl }: { liveViewUrl: string | null }) {
  if (!liveViewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-muted/30 rounded-lg border">
        <div className="text-center text-muted-foreground">
          <div className="animate-pulse mb-2">Starting browser session...</div>
          <p className="text-sm">The live browser view will appear here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full rounded-lg border overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400" />
          <div className="w-3 h-3 rounded-full bg-yellow-400" />
          <div className="w-3 h-3 rounded-full bg-green-400" />
        </div>
      </div>
      <iframe
        src={liveViewUrl}
        className="w-full border-0"
        style={{ height: "calc(100% - 40px)" }}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}
