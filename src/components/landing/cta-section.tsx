import Link from "next/link";

export function CtaSection() {
  return (
    <section className="relative z-[1] px-6 md:px-10 pb-28 text-center">
      <div className="max-w-[780px] mx-auto bg-bg-1 border border-border-highlight rounded-3xl py-20 px-8 md:px-16 relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -inset-[100px] bg-[radial-gradient(ellipse_at_50%_100%,oklch(0.68_0.18_255/0.12)_0%,transparent_65%)] pointer-events-none" />

        <h2 className="font-heading text-[clamp(32px,4vw,52px)] font-bold tracking-[-0.025em] leading-[1.1] text-foreground mb-4 relative">
          Stop shipping bugs.
          <br />
          Start shipping faster.
        </h2>
        <p className="text-base text-muted-foreground max-w-[420px] mx-auto mb-9 leading-[1.65] relative">
          Join the teams that never let testing slow down their AI-powered
          development workflow.
        </p>
        <div className="flex items-center justify-center gap-3 relative">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 bg-foreground text-black font-sans text-[15px] font-semibold px-7 py-3.5 rounded-full hover:opacity-90 hover:scale-[1.02] transition-all no-underline"
          >
            Get started free
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 11L11 3M11 3H5M11 3V9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <a
            href="#"
            className="inline-flex items-center bg-transparent border border-border-highlight font-sans text-[15px] font-medium px-7 py-3.5 rounded-full text-muted-foreground hover:text-foreground hover:border-muted-foreground hover:bg-white/[0.03] transition-all no-underline"
          >
            Book a demo
          </a>
        </div>
      </div>
    </section>
  );
}
