/**
 * Shimmer placeholder. Pure CSS (see globals.css) — no client JS, no state.
 *
 * Default flipped to "dark": no call site passes `tone` explicitly, and the
 * whole product now sits on the dark page gradient. `tone="light"` remains
 * for any future light-surface card. Always aria-hidden: a screen reader
 * should hear the real content or nothing, never a description of a grey
 * box. Where a skeleton stands in for content that is genuinely still
 * arriving, put aria-busy on the region that contains it.
 */
export default function Skeleton({
  className = "",
  tone = "dark",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return <div aria-hidden className={`skeleton ${tone === "dark" ? "skeleton-dark" : ""} ${className}`} />;
}
