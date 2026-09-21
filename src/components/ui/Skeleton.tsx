/**
 * Shimmer placeholder. Pure CSS (see globals.css) — no client JS, no state.
 *
 * `tone="dark"` for navy surfaces. Always aria-hidden: a screen reader should
 * hear the real content or nothing, never a description of a grey box. Where a
 * skeleton stands in for content that is genuinely still arriving, put
 * aria-busy on the region that contains it.
 */
export default function Skeleton({
  className = "",
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return <div aria-hidden className={`skeleton ${tone === "dark" ? "skeleton-dark" : ""} ${className}`} />;
}
