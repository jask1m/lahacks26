"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface ViewportState {
  x: number;
  y: number;
  scale: number;
}

const MIN_SCALE = 0.25;
const MAX_SCALE = 2.0;
const ZOOM_SENSITIVITY = 0.005;
const ZOOM_STEP = 0.1;

interface CanvasViewportProps {
  children: React.ReactNode;
  className?: string;
}

export function CanvasViewport({ children, className }: CanvasViewportProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportState>({ x: 0, y: 0, scale: 1 });
  const panState = useRef<{ isPanning: boolean; startX: number; startY: number; startTx: number; startTy: number }>({
    isPanning: false,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });

  // Center content on mount
  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const content = contentRef.current.getBoundingClientRect();
    setViewport({
      x: (container.width - content.width) / 2,
      y: 40,
      scale: 1,
    });
  }, []);

  // Zoom toward cursor
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    setViewport((prev) => {
      const delta = -e.deltaY * ZOOM_SENSITIVITY;
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * (1 + delta)));
      const ratio = newScale / prev.scale;

      return {
        x: cursorX - (cursorX - prev.x) * ratio,
        y: cursorY - (cursorY - prev.y) * ratio,
        scale: newScale,
      };
    });
  }, []);

  // Zoom in/out via buttons
  const zoomIn = useCallback(() => {
    setViewport((prev) => {
      const newScale = Math.min(MAX_SCALE, prev.scale + ZOOM_STEP);
      return { ...prev, scale: newScale };
    });
  }, []);

  const zoomOut = useCallback(() => {
    setViewport((prev) => {
      const newScale = Math.max(MIN_SCALE, prev.scale - ZOOM_STEP);
      return { ...prev, scale: newScale };
    });
  }, []);

  // Pan: mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-no-pan]")) return;

      panState.current = {
        isPanning: true,
        startX: e.clientX,
        startY: e.clientY,
        startTx: viewport.x,
        startTy: viewport.y,
      };

      e.preventDefault();
    },
    [viewport.x, viewport.y]
  );

  // Pan: mouse move & mouse up (window-level for smooth dragging)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!panState.current.isPanning) return;
      const dx = e.clientX - panState.current.startX;
      const dy = e.clientY - panState.current.startY;
      setViewport((prev) => ({
        ...prev,
        x: panState.current.startTx + dx,
        y: panState.current.startTy + dy,
      }));
    };

    const handleMouseUp = () => {
      panState.current.isPanning = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Prevent default wheel on the container element (passive: false needed)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e: WheelEvent) => e.preventDefault();
    el.addEventListener("wheel", prevent, { passive: false });
    return () => el.removeEventListener("wheel", prevent);
  }, []);

  const isPanning = panState.current.isPanning;

  return (
    <div className={`${className ?? ""} p-4`}>
      {/* Inset frame */}
      <div
        className="w-full h-full rounded-xl overflow-hidden relative"
        style={{
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow:
            "inset 0 0 0 1px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.04), 0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        {/* Canvas with light grid */}
        <div
          ref={containerRef}
          className="w-full h-full"
          style={{
            overflow: "hidden",
            position: "relative",
            cursor: isPanning ? "grabbing" : "grab",
            backgroundColor: "#f8f8fb",
            backgroundImage:
              "radial-gradient(circle, rgba(0,0,0,0.11) 1px, transparent 1px)",
            backgroundSize: `${20 * viewport.scale}px ${20 * viewport.scale}px`,
            backgroundPosition: `${viewport.x}px ${viewport.y}px`,
          }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
        >
          {/* Staging Area label */}
          <span
            className="absolute top-3 right-3.5 text-[10px] font-semibold uppercase pointer-events-none select-none z-10"
            style={{ color: "rgba(0,0,0,0.18)", letterSpacing: "0.08em" }}
          >
            Staging Area
          </span>

          {/* Pan/zoom content */}
          <div
            ref={contentRef}
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
              willChange: "transform",
            }}
          >
            {children}
          </div>

          {/* Zoom controls */}
          <div
            data-no-pan
            className="absolute bottom-3.5 right-3.5 flex items-center gap-0.5 rounded-lg select-none z-10"
            style={{
              background: "white",
              border: "1px solid rgba(0,0,0,0.1)",
              padding: "3px 5px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
          >
            <button
              onClick={zoomOut}
              className="flex items-center justify-center w-[22px] h-[22px] rounded-[5px] text-sm transition-colors"
              style={{ color: "rgba(0,0,0,0.4)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                e.currentTarget.style.color = "rgba(0,0,0,0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(0,0,0,0.4)";
              }}
            >
              −
            </button>
            <div className="w-px h-[13px] mx-0.5" style={{ background: "rgba(0,0,0,0.1)" }} />
            <span
              className="px-1 font-mono text-[10.5px] select-none"
              style={{ color: "rgba(0,0,0,0.35)" }}
            >
              {Math.round(viewport.scale * 100)}%
            </span>
            <div className="w-px h-[13px] mx-0.5" style={{ background: "rgba(0,0,0,0.1)" }} />
            <button
              onClick={zoomIn}
              className="flex items-center justify-center w-[22px] h-[22px] rounded-[5px] text-sm transition-colors"
              style={{ color: "rgba(0,0,0,0.4)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                e.currentTarget.style.color = "rgba(0,0,0,0.65)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "rgba(0,0,0,0.4)";
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
