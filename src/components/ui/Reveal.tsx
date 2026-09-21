"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Reveals content as it scrolls into view, once. Two modes:
 *
 * - Default: the wrapped element itself fades up. Reserve this for a genuine
 *   single element — most of this page uses `stagger` instead.
 * - `stagger`: the wrapper stays put and its direct children fade up in
 *   sequence (see `.stagger-children` in globals.css). Use this on an actual
 *   list — a card grid, a set of steps, a row of stats — where the whole
 *   point is that items arrive as a set. Do not reach for either mode on a
 *   section header or a block of prose; those should just render.
 *
 * The hidden state lives in CSS (`[data-reveal]` in globals.css) rather than in
 * React state, so there is no hydration flash and no re-render per section.
 * A <noscript> override in the layout forces everything visible if JS never
 * runs — otherwise a failed bundle would leave the page blank.
 */
export default function Reveal({
  children,
  delay = 0,
  stagger = false,
  as = "div",
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  stagger?: boolean;
  /** Render as this tag instead of a div — e.g. "ul"/"ol" so a stagger list's
   * <li> children stay direct children of a real list element. */
  as?: ElementType;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.reveal = "shown";
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = "shown";
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref}
      data-reveal=""
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={stagger ? `stagger-children ${className}` : className}
    >
      {children}
    </Tag>
  );
}
