"use client";

import { useEffect } from "react";

/** One-shot flash messages (?error=, ?info=, ?booked=) are shown by
 * reading a search param server-side, but that means the message comes
 * back on every refresh until the param is gone. This strips the given
 * params from the URL after the first render, via the raw History API —
 * not next/navigation's router, which would trigger a re-fetch and make
 * the message vanish immediately instead of just not surviving a refresh. */
export default function ClearFlashParams({ params }: { params: string[] }) {
  useEffect(() => {
    const url = new URL(window.location.href);
    let changed = false;
    for (const p of params) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(null, "", `${url.pathname}${url.search}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
