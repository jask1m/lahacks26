import Link from "next/link";
import { ReactNode } from "react";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  breadcrumbs: Breadcrumb[];
  actions?: ReactNode;
}

export function Topbar({ breadcrumbs, actions }: TopbarProps) {
  return (
    <div className="h-14 border-b border-border flex items-center justify-between px-7 bg-[rgba(8,8,16,0.7)] backdrop-blur-xl sticky top-0 z-10">
      <div className="flex items-center gap-2 text-[13px]">
        {breadcrumbs.map((crumb, i) => {
          const isLast = i === breadcrumbs.length - 1;
          return (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-text-tertiary opacity-40">/</span>}
              {isLast ? (
                <span className="text-foreground font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href || "#"}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
