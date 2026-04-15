"use client";

import { ReactNode } from "react";

interface RunnerLayoutProps {
  left: ReactNode;
  right: ReactNode;
}

export function RunnerLayout({ left, right }: RunnerLayoutProps) {
  return (
    <div className="grid grid-cols-[1fr_1fr] h-full gap-0">
      <div className="border-r overflow-hidden">{left}</div>
      <div className="p-4 overflow-hidden">{right}</div>
    </div>
  );
}
