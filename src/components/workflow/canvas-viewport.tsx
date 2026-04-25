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

  // Pan: mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only pan on left click on the canvas background
      if (e.button !== 0) return;
      // Don't pan when clicking interactive elements inside nodes
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
    <div
      ref={containerRef}
      className={className}
      style={{
        overflow: "hidden",
        position: "relative",
        cursor: isPanning ? "grabbing" : "grab",
        backgroundImage:
          "radial-gradient(circle, oklch(0.4 0 0 / 0.3) 1px, transparent 1px)",
        backgroundSize: `${24 * viewport.scale}px ${24 * viewport.scale}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
    >
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

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-bg-2/80 text-[11px] text-muted-foreground select-none pointer-events-none">
        {Math.round(viewport.scale * 100)}%
      </div>
    </div>
  );
}
