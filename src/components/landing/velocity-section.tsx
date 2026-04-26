const stats = [
  { num: "3×", accent: true, label: "faster release cycles" },
  { num: "94%", accent: true, label: "of critical bugs caught pre-deploy" },
  { num: "0", accent: true, label: "test scripts to maintain" },
  { num: "2m", accent: true, label: "avg time to first result" },
];

const timeline = [
  {
    step: "1",
    title: "PR opened",
    sub: "DeepCrawl crawl triggered automatically",
    time: "0:00",
    color: "bg-[oklch(0.68_0.18_255/0.15)] border-[oklch(0.68_0.18_255/0.4)] text-accent-blue",
  },
  {
    step: "2",
    title: "Crawl complete",
    sub: "1,200+ paths explored, issues surfaced on PR",
    time: "1:54",
    color: "bg-[oklch(0.68_0.18_255/0.15)] border-[oklch(0.68_0.18_255/0.4)] text-accent-blue",
  },
  {
    step: "✓",
    title: "Merge unblocked",
    sub: "All flows passing — safe to ship",
    time: "2:10",
    color: "bg-[oklch(0.7_0.16_162/0.15)] border-[oklch(0.7_0.16_162/0.4)] text-accent-green",
    titleColor: "text-accent-green",
  },
];

export function VelocitySection() {
  return (
    <section className="relative z-[1] max-w-[1100px] mx-auto px-6 md:px-10 pb-24">
      <div className="bg-bg-1 border border-border rounded-[20px] p-10 md:p-16 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
        {/* Left */}
        <div>
          <span className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-accent-blue mb-4 block">
            Shipping Velocity
          </span>
          <h2 className="font-heading text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.025em] leading-[1.1] text-foreground mb-4">
            Testing should accelerate you,
            <br />
            not slow you down.
          </h2>
          <p className="text-base text-muted-foreground leading-[1.65] mt-4">
            Teams using DeepCrawl ship 3× more often without increasing
            production incidents. Stop letting manual QA be the gating factor.
          </p>

          <div className="grid grid-cols-2 gap-4 mt-8">
            {stats.map((s) => (
              <div
                key={s.label}
                className="bg-bg-2 border border-border rounded-xl p-5"
              >
                <div className="font-heading text-4xl font-bold tracking-[-0.03em] text-accent-blue mb-1">
                  {s.num}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Timeline */}
        <div className="bg-bg-2 border border-border rounded-xl p-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5">
            PR → Merge timeline
          </div>
          <div className="flex flex-col">
            {timeline.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3.5 ${i < timeline.length - 1 ? "pb-5" : ""} relative`}
              >
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`w-7 h-7 rounded-full border flex items-center justify-center text-[11px] font-semibold ${item.color}`}
                  >
                    {item.step}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className="w-px flex-1 min-h-6 bg-border my-1" />
                  )}
                </div>
                <div className="pt-1">
                  <div
                    className={`text-[13px] font-semibold mb-0.5 ${item.titleColor || "text-foreground"}`}
                  >
                    {item.title}
                  </div>
                  <div className="text-[11.5px] text-text-tertiary">
                    {item.sub}
                  </div>
                </div>
                <div className="ml-auto font-mono text-[11px] text-text-tertiary pt-1.5">
                  {item.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
