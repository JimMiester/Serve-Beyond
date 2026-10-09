import { Link } from "next-view-transitions";
import type { ReactNode } from "react";

// active:scale matters more than hover here — most bookings happen on a phone,
// where there is no hover state at all.
const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-[background-color,border-color,transform] duration-200 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100";

const VARIANTS = {
  // emerald-600 rather than the logo's emerald: white on #00a878 is only 3.05:1.
  emerald: "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:outline-emerald",
  white: "bg-white text-navy hover:bg-cream focus-visible:outline-sky",
  // Dark-surface outline — the whole product rides the dark page gradient now.
  outline: "border border-white/25 text-white hover:border-white/50 hover:bg-white/10 focus-visible:outline-sky",
  onDark: "border border-white/25 text-white hover:border-white/50 hover:bg-white/10 focus-visible:outline-sky",
};

const SIZES = {
  sm: "px-5 py-2.5 text-[14px] sm:px-7",
  md: "px-7 py-3.5 text-[15px]",
};

export default function Button({
  href,
  variant = "emerald",
  size = "md",
  className = "",
  disabled = false,
  children,
}: {
  href?: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  className?: string;
  disabled?: boolean;
  children: ReactNode;
}) {
  const cls = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;
  return href ? (
    <Link href={href} className={cls}>
      {children}
    </Link>
  ) : (
    <button type="submit" className={cls} disabled={disabled}>
      {children}
    </button>
  );
}
