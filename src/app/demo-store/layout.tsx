import { SiteHeader } from "@/demo-site/components/site-header";
import { SiteFooter } from "@/demo-site/components/site-footer";
import { StoreToast } from "@/demo-site/components/store-toast";
import { StoreProvider } from "@/demo-site/lib/store-context";

export default function DemoStoreLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <StoreProvider>
      <div className="demo-store-light min-h-screen flex flex-col bg-background text-foreground">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <StoreToast />
      </div>
    </StoreProvider>
  );
}
