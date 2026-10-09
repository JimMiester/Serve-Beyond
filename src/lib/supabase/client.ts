import { createBrowserClient } from "@supabase/ssr";

/** Browser-side client. Only used where a client component genuinely needs
 * one — everything else in this project reads via server.ts.
 *
 * Dev-only: when the current tab is under /_dev/<slot>/..., this reads
 * that slot from the URL and uses the matching "sb-dev-<slot>" cookie, so
 * it agrees with the server-rendered pages in the same tab. isSingleton
 * is turned off so a fresh client is built per call instead of reusing a
 * cached one from a different slot. See src/lib/dev-slot.ts / proxy.ts. */
export function createClient() {
  const slot =
    process.env.NODE_ENV !== "production" && typeof window !== "undefined"
      ? window.location.pathname.match(/^\/_dev\/([a-zA-Z0-9_-]+)(\/|$)/)?.[1]
      : undefined;

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    slot ? { cookieOptions: { name: `sb-dev-${slot}` }, isSingleton: false } : undefined,
  );
}
