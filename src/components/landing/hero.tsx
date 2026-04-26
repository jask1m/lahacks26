import Link from "next/link";

export function Hero() {
  return (
    <section className="relative z-[1] pt-20 pb-16 text-center max-w-[1100px] mx-auto px-6 md:px-10">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 border border-border-highlight bg-white/[0.04] rounded-full px-3.5 py-1.5 text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-8">
        <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_6px_var(--accent-green)] animate-ta-pulse" />
        Now in Beta
      </div>

      {/* Headline */}
      <h1 className="font-heading text-[clamp(52px,7vw,88px)] font-bold leading-none tracking-[-0.03em] text-foreground mb-2">
        Catch Bugs Your
        <br />
        <span className="text-text-tertiary">Agents Can&apos;t</span>
      </h1>

      {/* Subtitle */}
      <p className="text-[17px] font-normal text-muted-foreground max-w-[520px] mx-auto mt-6 mb-9 leading-[1.65]">
        DeepCrawl runs exhaustive end-to-end tests across every path in your app
        — finding the edge cases AI coding agents introduce but never see.
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-center gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 bg-foreground text-black font-sans text-[15px] font-semibold px-7 py-3.5 rounded-full hover:opacity-90 hover:scale-[1.02] transition-all no-underline"
        >
          Start for free
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
          href="#features"
          className="inline-flex items-center bg-transparent border border-border-highlight font-sans text-[15px] font-medium px-7 py-3.5 rounded-full text-muted-foreground hover:text-foreground hover:border-muted-foreground hover:bg-white/[0.03] transition-all no-underline"
        >
          See how it works
        </a>
      </div>
    </section>
  );
}
