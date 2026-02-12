"use client";

/**
 * Mars Rejects–style section header: small label + big split headline.
 * Use for editorial, cinematic section intros.
 */
interface SectionHeaderProps {
  /** Small label above the headline (e.g. "events", "venue") */
  label: string;
  /** Headline lines — each renders on its own line for impact */
  lines: string[];
  /** Optional subtitle below the headline */
  subtitle?: string;
  className?: string;
}

export default function SectionHeader({ label, lines, subtitle, className = "" }: SectionHeaderProps) {
  return (
    <header className={`mb-10 md:mb-14 ${className}`}>
      <p className="text-xs md:text-sm tracking-[0.3em] text-white/50 uppercase mb-3 md:mb-4">
        {label}
      </p>
      <h2 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.95] tracking-tight" style={{ fontFamily: "Impact, sans-serif" }}>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </h2>
      {subtitle && (
        <p className="mt-4 md:mt-6 text-white/60 text-base md:text-lg max-w-xl">
          {subtitle}
        </p>
      )}
    </header>
  );
}
