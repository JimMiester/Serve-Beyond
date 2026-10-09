/**
 * Eyebrow + display heading + lede. Extracted because six sections use it
 * verbatim — not built ahead of the need.
 *
 * Default flipped to "dark": every call site across the app relies on the
 * default (none pass `tone` explicitly), and the whole product now sits on
 * the dark page gradient. `tone="light"` remains for any future light card.
 */
export default function SectionHead({
  eyebrow,
  title,
  lede,
  tone = "dark",
  className = "",
  level = "h2",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  tone?: "light" | "dark";
  className?: string;
  /** "h1" on a standalone page where this is the only heading (most
   * call sites); stays the "h2" default on the homepage, where Hero's own
   * <h1> already exists and Programs/Coaches are sections within it. */
  level?: "h1" | "h2";
}) {
  const dark = tone === "dark";
  const Heading = level;
  return (
    <header className={`max-w-2xl ${className}`}>
      <p
        className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-sky" : "text-emerald-700"
        }`}
      >
        {eyebrow}
      </p>
      <Heading
        className={`mt-4 font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.06] tracking-[-0.015em] ${
          dark ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </Heading>
      {lede && (
        <p className={`mt-5 text-[17px] leading-[1.65] ${dark ? "text-cream/75" : "text-navy/70"}`}>
          {lede}
        </p>
      )}
    </header>
  );
}
