import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProductMockup } from "@/components/landing/product-mockup";
import { LogosSection } from "@/components/landing/logos-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { VelocitySection } from "@/components/landing/velocity-section";
import { CtaSection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="relative z-[1] min-h-screen scroll-smooth">
      <Navbar />
      <main>
        <Hero />
        <ProductMockup />
        <LogosSection />
        <FeaturesSection />
        <VelocitySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
