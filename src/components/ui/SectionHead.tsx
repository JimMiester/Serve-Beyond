/**
 * Eyebrow + display heading + lede. Extracted because six sections use it
 * verbatim — not built ahead of the need.
 */
export default function SectionHead({
  eyebrow,
  title,
  lede,
  tone = "light",
  className = "",
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
  tone?: "light" | "dark";
  className?: string;
}) {
  const dark = tone === "dark";
  return (
    <header className={`max-w-2xl ${className}`}>
      <p
        className={`text-[12px] font-semibold uppercase tracking-[0.2em] ${
          dark ? "text-sky" : "text-emerald-700"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-4 font-display text-[clamp(2rem,4.4vw,3rem)] leading-[1.06] tracking-[-0.015em] ${
          dark ? "text-white" : "text-navy"
        }`}
      >
        {title}
      </h2>
      {lede && (
        <p className={`mt-5 text-[17px] leading-[1.65] ${dark ? "text-cream/75" : "text-navy/70"}`}>
          {lede}
        </p>
      )}
    </header>
  );
}
