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
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <StoreToast />
      </div>
    </StoreProvider>
  );
}
