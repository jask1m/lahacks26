const logos = ["Acme Corp", "Vercel", "Retool", "Linear", "Loom", "Figma"];

export function LogosSection() {
  return (
    <div className="relative z-[1] py-12 px-6 md:px-10 text-center border-t border-border border-b">
      <div className="text-[11.5px] font-semibold tracking-[0.1em] uppercase text-text-tertiary mb-7">
        Trusted by engineering teams shipping fast
      </div>
      <div className="flex items-center justify-center gap-12 flex-wrap">
        {logos.map((name) => (
          <div
            key={name}
            className="font-heading font-bold text-base text-text-tertiary opacity-50 tracking-[-0.02em]"
          >
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}
