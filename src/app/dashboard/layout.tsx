import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <header className="border-b bg-white">
        <div className="flex h-14 items-center px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold">
              T
            </div>
            <span className="font-semibold text-lg">TesterArmy</span>
          </Link>
        </div>
      </header>
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  );
}
