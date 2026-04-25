"use client";

import { ReactNode } from "react";

interface RunnerLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function RunnerLayout({ left, right }: RunnerLayoutProps) {
  return (
    <div className="grid grid-cols-[340px_1fr] h-full gap-0">
      <div className="bg-bg-1 border-r border-border overflow-hidden">{left}</div>
      <div className="bg-bg-0 overflow-hidden">{right}</div>
    </div>
  );
}
