import Link from "next/link";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 h-[60px] flex items-center justify-between px-6 md:px-10 bg-bg-0/80 backdrop-blur-2xl border-b border-border">
      <Link
        href="/"
        className="flex items-center gap-2.5 font-heading font-bold text-lg text-foreground no-underline"
      >
        <div className="w-[30px] h-[30px] bg-accent-blue rounded-lg flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8C2 4.69 4.69 2 8 2s6 2.69 6 6-2.69 6-6 6S2 11.31 2 8z"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle cx="8" cy="8" r="1.5" fill="white" />
          </svg>
        </div>
        DeepCrawl
      </Link>

      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard"
          className="hidden md:inline-flex bg-transparent border-none cursor-pointer font-sans text-[13.5px] font-medium text-muted-foreground px-4 py-2 rounded-lg hover:text-foreground hover:bg-white/5 transition-colors no-underline"
        >
          Sign In
        </Link>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 bg-foreground text-black font-sans text-[13.5px] font-semibold px-5 py-2.5 rounded-full hover:opacity-90 hover:scale-[1.02] transition-all no-underline"
        >
          Get a Demo
          <span className="w-5 h-5 bg-black rounded-full flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path
                d="M2.5 7.5L7.5 2.5M7.5 2.5H3.5M7.5 2.5V6.5"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </Link>
      </div>
    </nav>
  );
}
