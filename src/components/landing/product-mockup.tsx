const issues = [
  {
    name: "Checkout flow breaks with guest user after promo code applied",
    page: "/checkout/payment",
    severity: "CRITICAL",
    sevClass: "bg-destructive shadow-[0_0_5px_var(--destructive)]",
    sevColor: "text-destructive",
    status: "New",
    statusClass:
      "bg-[oklch(0.65_0.18_22/0.15)] text-destructive border border-[oklch(0.65_0.18_22/0.25)]",
    statusDot: "\u25cf",
    time: "Today, 3:14 PM",
  },
  {
    name: "Auth token not invalidated on password change",
    page: "/settings/security",
    severity: "CRITICAL",
    sevClass: "bg-destructive shadow-[0_0_5px_var(--destructive)]",
    sevColor: "text-destructive",
    status: "Investigating",
    statusClass:
      "bg-[oklch(0.68_0.18_255/0.15)] text-accent-blue border border-[oklch(0.68_0.18_255/0.25)]",
    statusDot: "\u25cf",
    time: "Today, 1:42 PM",
  },
  {
    name: "Race condition in cart quantity update causes negative stock",
    page: "/cart",
    severity: "HIGH",
    sevClass: "bg-[oklch(0.72_0.18_55)]",
    sevColor: "text-[oklch(0.72_0.18_55)]",
    status: "New",
    statusClass:
      "bg-[oklch(0.65_0.18_22/0.15)] text-destructive border border-[oklch(0.65_0.18_22/0.25)]",
    statusDot: "\u25cf",
    time: "Today, 11:07 AM",
  },
  {
    name: "Search returns stale results after filter reset",
    page: "/search",
    severity: "MEDIUM",
    sevClass: "bg-[oklch(0.75_0.14_90)]",
    sevColor: "text-[oklch(0.75_0.14_90)]",
    status: "Fixed",
    statusClass:
      "bg-[oklch(0.7_0.16_162/0.15)] text-accent-green border border-[oklch(0.7_0.16_162/0.25)]",
    statusDot: "\u2713",
    time: "Yesterday, 6:55 PM",
  },
  {
    name: "User profile image upload silently fails on Safari",
    page: "/profile/edit",
    severity: "MEDIUM",
    sevClass: "bg-[oklch(0.75_0.14_90)]",
    sevColor: "text-[oklch(0.75_0.14_90)]",
    status: "New",
    statusClass:
      "bg-[oklch(0.65_0.18_22/0.15)] text-destructive border border-[oklch(0.65_0.18_22/0.25)]",
    statusDot: "\u25cf",
    time: "Yesterday, 4:20 PM",
  },
];

export function ProductMockup() {
  return (
    <div className="relative z-[1] max-w-[960px] mx-auto px-6 md:px-10">
      {/* Glow */}
      <div className="absolute -inset-[60px] bg-[radial-gradient(ellipse_at_50%_10%,oklch(0.68_0.18_255/0.12)_0%,transparent_65%)] pointer-events-none" />

      <div className="border border-border-highlight rounded-xl overflow-hidden bg-bg-1 shadow-[0_40px_80px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)]">
        {/* Title bar */}
        <div className="h-11 bg-bg-2 border-b border-border flex items-center px-4 gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 h-[26px] bg-white/[0.06] border border-border rounded-md flex items-center px-2.5 gap-1.5 font-mono text-[11px] text-text-tertiary max-w-[340px] mx-auto">
            <div className="w-[5px] h-[5px] rounded-full bg-accent-green" />
            app.deepcrawl.dev / results
          </div>
        </div>

        {/* App topbar */}
        <div className="h-[52px] bg-bg-1 border-b border-border flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-accent-blue rounded-[7px] flex items-center justify-center text-sm">
              🕷
            </div>
            <div>
              <div className="text-[13px] font-semibold">DeepCrawl</div>
              <div className="text-[11px] text-text-tertiary">
                deepcrawl.dev
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-7 px-3 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 bg-white/[0.07] text-muted-foreground border border-border">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle
                  cx="5"
                  cy="5"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                />
                <path
                  d="M5 3v2l1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </svg>
              Schedule
            </div>
            <div className="h-7 px-3 rounded-md text-[11.5px] font-medium flex items-center gap-1.5 bg-accent-blue text-white">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <path
                  d="M5.5 2v7M2 5.5h7"
                  stroke="white"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              New Crawl
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="h-[38px] bg-bg-1 border-b border-border flex items-center px-5">
          <div className="h-[38px] px-3.5 text-xs font-medium text-foreground flex items-center gap-1.5 border-b-2 border-accent-blue">
            Issues{" "}
            <span className="bg-destructive text-white text-[10px] font-semibold px-1.5 py-px rounded">
              14
            </span>
          </div>
          <div className="h-[38px] px-3.5 text-xs font-medium text-text-tertiary flex items-center gap-1.5 border-b-2 border-transparent">
            Runs{" "}
            <span className="bg-bg-3 text-muted-foreground text-[10px] font-semibold px-1.5 py-px rounded">
              47
            </span>
          </div>
          <div className="h-[38px] px-3.5 text-xs font-medium text-text-tertiary flex items-center gap-1.5 border-b-2 border-transparent">
            Coverage
          </div>
          <div className="h-[38px] px-3.5 text-xs font-medium text-text-tertiary flex items-center gap-1.5 border-b-2 border-transparent">
            Integrations
          </div>
          <div className="h-[38px] px-3.5 text-xs font-medium text-text-tertiary flex items-center gap-1.5 border-b-2 border-transparent">
            Settings
          </div>
        </div>

        {/* Toolbar */}
        <div className="h-11 bg-bg-1 border-b border-border flex items-center px-5 gap-2.5">
          <div className="h-7 bg-white/5 border border-border rounded-md flex items-center px-2.5 gap-1.5 text-xs text-text-tertiary w-[200px]">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle
                cx="5"
                cy="5"
                r="3.5"
                stroke="currentColor"
                strokeWidth="1.2"
              />
              <path
                d="M8 8l2 2"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
            Search issues...
          </div>
          <div className="h-7 px-3 rounded-md bg-white/5 border border-border text-[11.5px] text-muted-foreground flex items-center gap-1.5">
            Severity ↓
          </div>
          <div className="h-7 px-3 rounded-md bg-white/5 border border-border text-[11.5px] text-muted-foreground flex items-center gap-1.5">
            All statuses ↓
          </div>
          <div className="ml-auto text-[11.5px] text-text-tertiary">
            Last crawl: 2 min ago
          </div>
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Issue", "Page", "Severity", "Status", "Detected"].map(
                (h) => (
                  <th
                    key={h}
                    className="h-8 px-5 text-[11px] font-semibold uppercase tracking-[0.06em] text-text-tertiary text-left border-b border-border bg-bg-1"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {issues.map((issue, i) => (
              <tr key={i} className="hover:bg-white/[0.02]">
                <td className="h-11 px-5 text-[12.5px] text-muted-foreground border-b border-border last:border-b-0">
                  <div className="flex items-center gap-2 text-foreground font-medium text-[12.5px]">
                    <div
                      className={`w-[7px] h-[7px] rounded-full shrink-0 ${issue.sevClass}`}
                    />
                    {issue.name}
                  </div>
                </td>
                <td className="h-11 px-5 text-[11.5px] text-text-tertiary border-b border-border">
                  {issue.page}
                </td>
                <td
                  className={`h-11 px-5 text-[11px] font-semibold border-b border-border ${issue.sevColor}`}
                >
                  {issue.severity}
                </td>
                <td className="h-11 px-5 border-b border-border">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[5px] text-[11px] font-semibold ${issue.statusClass}`}
                  >
                    {issue.statusDot} {issue.status}
                  </span>
                </td>
                <td className="h-11 px-5 text-xs text-text-tertiary border-b border-border">
                  {issue.time}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
