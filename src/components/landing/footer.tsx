const links = ["Privacy", "Terms", "Docs", "Status"];

export function Footer() {
  return (
    <footer className="relative z-[1] border-t border-border py-8 px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-5">
      <div className="flex items-center gap-2 font-heading font-bold text-[15px] text-foreground">
        <div className="w-6 h-6 bg-accent-blue rounded-md flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8C2 4.69 4.69 2 8 2s6 2.69 6 6-2.69 6-6 6S2 11.31 2 8z"
              stroke="white"
              strokeWidth="1.5"
            />
            <circle cx="8" cy="8" r="1.5" fill="white" />
          </svg>
        </div>
        DeepCrawl
      </div>
      <div className="flex gap-6">
        {links.map((link) => (
          <a
            key={link}
            href="#"
            className="text-[12.5px] text-text-tertiary hover:text-muted-foreground no-underline transition-colors"
          >
            {link}
          </a>
        ))}
      </div>
      <div className="text-xs text-text-tertiary">
        &copy; 2026 DeepCrawl. All rights reserved.
      </div>
    </footer>
  );
}
