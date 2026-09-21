/**
 * The card shape already repeated three times (Programs, Coaches, Pricing)
 * before this extraction, plus five new pages that need the same look —
 * the same threshold that justified extracting Button in Phase 1.
 *
 * `featured` is the raised navy/white variant (Pricing's middle tier).
 * `elevated` is for a card that needs to visually separate from a
 * same-tone (cream) page background — the sign-in/sign-up forms are the
 * first case: a cream card on a cream page reads as blended-in, not framed.
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
      ? "rounded-[var(--radius-card)] bg-navy text-white shadow-[0_24px_60px_-24px_rgba(15,36,48,0.55)]"
      : variant === "elevated"
        ? "rounded-[var(--radius-card)] border border-navy/8 bg-white shadow-[0_30px_80px_-28px_rgba(15,36,48,0.35)]"
        : "rounded-[var(--radius-card)] border border-navy/10 bg-cream";

  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
