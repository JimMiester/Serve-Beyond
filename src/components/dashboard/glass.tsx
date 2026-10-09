import Link from "next/link";
import type { CSSProperties, HTMLAttributes, ReactNode } from "react";

/** The one glass surface every dashboard block uses — see .glass-card in
 * globals.css. `delay` sets the mount stagger (~60ms per card per spec). */
export function GlassCard({
  className = "",
  delay = 0,
  children,
  ...rest
}: {
  className?: string;
  delay?: number;
  children: ReactNode;
} & HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`glass-card glass-card-interactive dash-enter rounded-[var(--radius-card)] border border-white/10 p-6 ${className}`}
      style={{ animationDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </div>
  );
}

type AccentButtonProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  type?: "submit" | "button";
};

/** Solid pill filled with var(--accent) — reads the CSS variable directly
 * so the whole page recolors from the one line declared in globals.css. */
export function AccentButton({ children, className = "", href, onClick, type = "button" }: AccentButtonProps) {
  const classes = `inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-14px_var(--accent)] transition-all duration-200 hover:brightness-110 hover:scale-[1.03] active:scale-[0.97] ${className}`;
  const style: CSSProperties = {
    background: "linear-gradient(135deg, var(--accent), var(--accent-deep))",
  };

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes} style={style}>
      {children}
    </button>
  );
}

/** Translucent pill for secondary actions ("View History") — same glass
 * family as GlassCard but pill-shaped and interactive. */
export function GlassButton({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:bg-white/10 active:scale-[0.97]"
    >
      {children}
    </Link>
  );
}
