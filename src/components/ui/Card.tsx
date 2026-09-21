/**
 * The card shape already repeated three times (Programs, Coaches, Pricing)
 * before this extraction, plus five new pages that need the same look —
 * the same threshold that justified extracting Button in Phase 1.
 *
 * `featured` is the one real visual variant in use today: Pricing's middle
 * tier (navy fill, white text, raised). Everything else is the default:
 * a bordered cream/white card. No other variant exists yet — don't invent
 * one ahead of a page that actually needs it.
 */
export default function Card({
  variant = "default",
  className = "",
  children,
}: {
  variant?: "default" | "featured";
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    variant === "featured"
      ? "rounded-[var(--radius-card)] bg-navy text-white shadow-[0_24px_60px_-24px_rgba(15,36,48,0.55)]"
      : "rounded-[var(--radius-card)] border border-navy/10 bg-cream";

  return <div className={`${base} ${className}`}>{children}</div>;
}
