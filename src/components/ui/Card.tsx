/**
 * The card shape already repeated three times (Programs, Coaches, Pricing)
 * before this extraction, plus five new pages that need the same look —
 * the same threshold that justified extracting Button in Phase 1.
 *
 * All three variants share the same dark-glass surface (.glass-card) now
 * that the whole product rides the dark page gradient — they differ only
 * in border weight/color and shadow depth, not in fill.
 * `featured` is Pricing's middle tier, called out with a --accent border.
 * `elevated` is for a card that needs to visually separate the most from
 * the page — the sign-in/sign-up forms are the first case.
 */
export default function Card({
  as: Tag = "div",
  variant = "default",
  className = "",
  children,
  ...rest
}: {
  as?: React.ElementType;
  variant?: "default" | "featured" | "elevated";
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const base =
    variant === "featured"
      ? "glass-card rounded-[var(--radius-card)] border-2 border-[var(--accent)] shadow-[0_24px_60px_-24px_rgba(0,0,0,0.5)]"
      : variant === "elevated"
        ? "glass-card rounded-[var(--radius-card)] border border-white/10 shadow-[0_30px_80px_-28px_rgba(0,0,0,0.6)]"
        : "glass-card rounded-[var(--radius-card)] border border-white/10";

  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
