import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  valueClassName?: string;
  children?: ReactNode;
}

export function StatCard({ label, value, delta, valueClassName }: StatCardProps) {
  return (
    <div className="bg-bg-1 border border-border rounded-lg px-[18px] py-4 flex flex-col gap-1.5">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
        {label}
      </div>
      <div
        className={`font-heading text-[26px] font-bold tracking-tight text-foreground ${valueClassName ?? ""}`}
      >
        {value}
      </div>
      {delta && (
        <div className="text-xs text-accent-green flex items-center gap-1">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M5 8V2M2 5l3-3 3 3"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {delta}
        </div>
      )}
    </div>
  );
}
