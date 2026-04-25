"use client";

import { ReactNode } from "react";

interface RunnerLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function RunnerLayout({ left, right }: RunnerLayoutProps) {
  return (
    <div className="w-full h-full p-[14px] overflow-hidden">
      <div
        className="w-full h-full rounded-xl overflow-hidden"
        style={{
          border: "1px solid rgba(255,255,255,0.085)",
          boxShadow:
            "0 0 0 1px rgba(0,0,0,0.35), 0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        <div className="grid grid-cols-[310px_1fr] h-full gap-0">
          <div className="bg-bg-1 border-r border-[rgba(255,255,255,0.06)] overflow-hidden">
            {left}
          </div>
          <div className="bg-bg-2 overflow-hidden">{right}</div>
        </div>
      </div>
    </div>
  );
}
