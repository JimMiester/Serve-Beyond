"use client";

import { useEffect, useRef, type ElementType, type ReactNode } from "react";

/**
 * Fades content in and out as it crosses in and out of the viewport, in
 * either scroll direction — not a one-shot entrance. Two modes:
 *
 * - Default: the wrapped element itself fades. Reserve this for a genuine
 *   single element — most of this page uses `stagger` instead.
 * - `stagger`: the wrapper stays put and its direct children fade in
 *   sequence (see `.stagger-children` in globals.css). Use this on an actual
 *   list — a card grid, a set of steps, a row of stats — where the whole
 *   point is that items arrive as a set.
 *
 * The visible/hidden state lives in CSS (`[data-reveal]` in globals.css)
 * rather than React state, so toggling it on every scroll pass costs a
 * DOM-attribute write, not a re-render. A <noscript> override in the layout
 * forces everything visible if JS never runs, so a failed bundle never hides
 * the page.
 *
 * One IntersectionObserver instance serves every Reveal on the page (see
 * `sharedObserver` below) instead of each instance creating its own — with
 * elements now watched for as long as they're mounted, rather than
 * disconnected after a single entry, an unbounded number of observers would
 * otherwise accumulate as more sections adopt this component.
 */

const callbacks = new WeakMap<Element, (visible: boolean) => void>();

let sharedObserver: IntersectionObserver | null = null;

function getSharedObserver() {
  if (sharedObserver) return sharedObserver;
  sharedObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        callbacks.get(entry.target)?.(entry.isIntersecting);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.04 },
  );
  return sharedObserver;
}

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

    const observer = getSharedObserver();
    callbacks.set(el, (visible) => {
      el.dataset.reveal = visible ? "shown" : "";
    });
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      callbacks.delete(el);
    };
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
