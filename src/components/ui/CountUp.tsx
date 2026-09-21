"use client";

import { useEffect, useRef } from "react";

/**
 * Counts up to the numeric part of `value` when scrolled into view.
 * "600+" counts to 600 and keeps the "+". Non-numeric values are left alone.
 *
 * The server renders the FINAL value, so the real number is in the HTML for
 * crawlers and for anyone without JS. The animation then writes textContent
 * directly rather than going through state — one node write per frame instead
 * of one React render per frame. Nothing re-renders this component, so React
 * never clobbers what we wrote.
 *
 * If the value fails to parse it simply never animates, which is why the
 * fallback is the correct number rather than a zero.
 */
export default function CountUp({ value, className = "" }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const target = Number(value.replace(/[^\d]/g, ""));
    if (!Number.isFinite(target) || target <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const suffix = value.replace(/^[\d,]+/, "");
    el.textContent = `0${suffix}`;

    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const DURATION = 1100;
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min((now - start) / DURATION, 1);
          const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
          el.textContent = `${Math.round(eased * target).toLocaleString()}${suffix}`;
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
