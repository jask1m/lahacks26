import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen relative z-[1]">
      <Sidebar />
      <main className="flex-1 ml-[220px] flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
