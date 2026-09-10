interface SectionHeaderProps {
  title: string;
  subtitle?: string;
}

/** Shared section title treatment — mirrors the header nav pill so every
 * section on the page reads as one consistent design system.
 *
 * The subtitle used to sit 16px under the pill with 40px below the whole block,
 * which put more air between a heading and its own subtitle than the craft the
 * page needed. Related lines are tight; the gap to the content is generous. */
export default function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-10 text-center sm:mb-12">
      <div className="inline-block rounded-full border border-fg/20 bg-canvas/80 px-6 py-2 backdrop-blur-sm">
        <h2 className="font-heading text-2xl tracking-widest text-fg md:text-3xl">{title}</h2>
      </div>
      {subtitle && (
        <p className="mx-auto mt-3 max-w-prose text-sm tracking-wide text-fg-muted md:text-base">
          {subtitle}
        </p>
      )}
    </div>
  );
}
