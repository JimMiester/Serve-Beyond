"use client";

import { useEffect } from "react";
import Link from "next/link";

/** Shared body for every route group's error.tsx — Next.js requires each
 * one to be its own Client Component, but there's no reason to design five
 * separate error screens when the content differs only by where "home"
 * points. Not used by global-error.tsx, which replaces the root layout
 * entirely and can't assume this component's own imports still work. */
export default function ErrorScreen({
  error,
  reset,
  homeHref = "/",
  homeLabel = "Back home",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref?: string;
  homeLabel?: string;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-[70svh] max-w-[560px] flex-col items-center justify-center px-5 text-center sm:px-8">
      <h1 className="font-display text-[clamp(1.75rem,4vw,2.25rem)] text-white">Something went wrong</h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-white/65">
        That&rsquo;s on us, not something you did. Try again, or head back and pick up from there.
      </p>
      {error.digest && (
        <p className="mt-4 text-[13px] text-white/40">
          Reference: <code className="font-mono">{error.digest}</code>
        </p>
      )}
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-emerald-600 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald"
        >
          Try again
        </button>
        <Link
          href={homeHref}
          className="rounded-full border border-white/25 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
        >
          {homeLabel}
        </Link>
      </div>
    </main>
  );
}
