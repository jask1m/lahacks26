const coverageData = [
  { label: "Authentication", pct: 100, color: "bg-accent-green" },
  { label: "Checkout", pct: 64, color: "bg-destructive" },
  { label: "Search & Filter", pct: 91, color: "bg-accent-blue" },
  { label: "User Profile", pct: 78, color: "bg-accent-blue" },
  { label: "Admin Dashboard", pct: 100, color: "bg-accent-green" },
];

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative z-[1] max-w-[1100px] mx-auto px-6 md:px-10 py-24"
    >
      <span className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-accent-blue mb-4 block">
        Why DeepCrawl
      </span>
      <h2 className="font-heading text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.025em] leading-[1.1] text-foreground mb-4">
        Your agent writes the code.
        <br />
        We make sure it actually works.
      </h2>
      <p className="text-base text-muted-foreground max-w-[480px] leading-[1.65]">
        AI agents are great at generating code, but terrible at knowing what
        they broke. DeepCrawl fills that gap.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14">
        {/* Card 1 - full width */}
        <div className="bg-bg-1 border border-border rounded-2xl p-8 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-10 items-center hover:border-border-highlight transition-colors">
          <div>
            <div className="w-10 h-10 rounded-[10px] bg-[oklch(0.65_0.18_22/0.15)] text-destructive flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3L17 15H3L10 3Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 8v4M10 13.5v.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="font-heading text-[19px] font-bold tracking-[-0.02em] text-foreground mb-2.5">
              Catches what agents introduce
            </div>
            <div className="text-sm text-muted-foreground leading-[1.65]">
              Every code change from your AI agent triggers a deep crawl.
              DeepCrawl explores your entire app like a user — clicking, filling
              forms, navigating flows — finding bugs that unit tests and linters
              can&apos;t see.
            </div>
            {/* Mini terminal */}
            <div className="bg-bg-0 border border-border rounded-[10px] p-4 font-mono text-[11.5px] leading-[1.8] mt-5">
              <div>
                <span className="text-text-tertiary">→</span>{" "}
                <span className="text-accent-blue">crawl</span>{" "}
                <span className="text-foreground">
                  feat/ai-checkout-refactor
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">&nbsp;&nbsp;✓</span>{" "}
                <span className="text-accent-green">
                  1,204 paths explored
                </span>
              </div>
              <div>
                <span className="text-text-tertiary">&nbsp;&nbsp;✓</span>{" "}
                <span className="text-accent-green">
                  All auth flows passing
                </span>
              </div>
              <div className="text-destructive">
                &nbsp;&nbsp;✗ CRITICAL: guest checkout fails at step 3
              </div>
              <div className="text-destructive">
                &nbsp;&nbsp;✗ HIGH: cart race condition under load
              </div>
              <div>
                <span className="text-text-tertiary">
                  &nbsp;&nbsp;→ 2 issues blocked merge
                </span>
              </div>
            </div>
          </div>

          {/* Coverage chart */}
          <div className="bg-bg-2 border border-border rounded-xl p-6">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-5">
              Coverage by flow
            </div>
            <div className="flex flex-col gap-3">
              {coverageData.map((item) => (
                <div key={item.label} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground">
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-semibold font-mono ${item.pct < 70 ? "text-destructive" : "text-foreground"}`}
                    >
                      {item.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-bg-3 rounded overflow-hidden">
                    <div
                      className={`h-full rounded ${item.color}`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-bg-1 border border-border rounded-2xl p-8 hover:border-border-highlight transition-colors">
          <div className="w-10 h-10 rounded-[10px] bg-[oklch(0.68_0.18_255/0.15)] text-accent-blue flex items-center justify-center mb-5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M10 2v4M10 14v4M2 10h4M14 10h4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle
                cx="10"
                cy="10"
                r="3"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div className="font-heading text-[19px] font-bold tracking-[-0.02em] text-foreground mb-2.5">
            Zero config. Runs in CI.
          </div>
          <div className="text-sm text-muted-foreground leading-[1.65]">
            Connect your GitHub repo, point DeepCrawl at your staging URL, and
            you&apos;re done. Tests run automatically on every PR — no test
            scripts to write, no selectors to maintain.
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-bg-1 border border-border rounded-2xl p-8 hover:border-border-highlight transition-colors">
          <div className="w-10 h-10 rounded-[10px] bg-[oklch(0.7_0.16_162/0.15)] text-accent-green flex items-center justify-center mb-5">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M4 10l4 4 8-8"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="font-heading text-[19px] font-bold tracking-[-0.02em] text-foreground mb-2.5">
            Ship without the bottleneck
          </div>
          <div className="text-sm text-muted-foreground leading-[1.65]">
            DeepCrawl gives every engineer QA superpowers. No dedicated QA team
            required. Merge with confidence — not crossed fingers.
          </div>
        </div>
      </div>
    </section>
  );
}
