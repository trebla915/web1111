interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

/** Shared section title treatment — mirrors the header nav pill so every
 * section on the page reads as one consistent design system. */
export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-10 text-center">
      <div className="inline-block bg-black/80 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20">
        <h2 className="text-2xl md:text-3xl font-display tracking-widest text-white">{title}</h2>
      </div>
      {subtitle && (
        <p className="mt-4 text-white/60 tracking-wide text-sm md:text-base">{subtitle}</p>
      )}
    </div>
  );
}
