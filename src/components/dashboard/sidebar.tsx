"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  List,
  CalendarClock,
  TrendingUp,
  Clock,
  Star,
} from "lucide-react";

const workspaceNav = [
  { label: "Projects", href: "/dashboard", icon: LayoutGrid },
  { label: "Test Suites", href: "/dashboard/suites", icon: List },
  { label: "Schedules", href: "/dashboard/schedules", icon: CalendarClock },
];

const insightsNav = [
  { label: "Reports", href: "/dashboard/reports", icon: TrendingUp },
  { label: "Run History", href: "/dashboard/history", icon: Clock },
  { label: "Integrations", href: "/dashboard/integrations", icon: Star },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname.startsWith("/dashboard/projects");
    return pathname.startsWith(href);
  }

  return (
    <aside className="fixed top-0 left-0 bottom-0 w-[220px] bg-bg-1 border-r border-border flex flex-col z-50">
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-5 py-5 pb-4 border-b border-border"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-blue to-accent-green flex items-center justify-center text-white font-heading font-bold text-sm shrink-0">
          T
        </div>
        <span className="font-heading font-semibold text-[15px] text-foreground tracking-tight">
          TesterArmy
        </span>
      </Link>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5">
        <div className="text-[10px] font-semibold tracking-widest uppercase text-text-tertiary px-2.5 pt-2 pb-1.5">
          Workspace
        </div>
        {workspaceNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors select-none ${
                active
                  ? "bg-accent-blue/12 text-accent-blue border border-accent-blue/30"
                  : "text-muted-foreground hover:bg-bg-2 hover:text-foreground border border-transparent"
              }`}
            >
              <item.icon className="h-[15px] w-[15px] shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="h-px bg-border my-2" />

        <div className="text-[10px] font-semibold tracking-widest uppercase text-text-tertiary px-2.5 pt-2 pb-1.5">
          Insights
        </div>
        {insightsNav.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13.5px] font-medium transition-colors select-none ${
                active
                  ? "bg-accent-blue/12 text-accent-blue border border-accent-blue/30"
                  : "text-muted-foreground hover:bg-bg-2 hover:text-foreground border border-transparent"
              }`}
            >
              <item.icon className="h-[15px] w-[15px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User pill */}
      <div className="px-2.5 py-3 border-t border-border">
        <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-md">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#3b3b6b] to-[#1a1a3e] flex items-center justify-center text-[11px] font-semibold text-muted-foreground border border-border-highlight shrink-0">
            U
          </div>
          <span className="text-[13px] text-muted-foreground font-medium truncate">
            User
          </span>
        </div>
      </div>
    </aside>
  );
}
