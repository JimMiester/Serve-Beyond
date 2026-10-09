import { headers } from "next/headers";

const DEV_SLOT_HEADER = "x-dev-slot";
const COOKIE_PREFIX = "sb-dev-";

/**
 * Local-testing helper: when a page is reached through /_dev/<slot>/...
 * (see proxy.ts), this reads which slot the current request belongs to, so
 * server code can keep that tab's Supabase session on its own cookie
 * instead of the one every other tab shares. Always null in production —
 * proxy.ts never rewrites a /_dev/ URL there, so this header never appears.
 */
export async function getDevSlot(): Promise<string | null> {
  if (process.env.NODE_ENV === "production") return null;
  return (await headers()).get(DEV_SLOT_HEADER);
}

/** cookieOptions to hand to createServerClient/createBrowserClient so this
 * request's Supabase client reads and writes the current slot's own
 * cookie rather than the shared session cookie. undefined (Supabase's
 * default cookie) outside of /_dev/ testing. */
export function devSlotCookieOptions(slot: string | null): { name: string } | undefined {
  return slot ? { name: `${COOKIE_PREFIX}${slot}` } : undefined;
}

/**
 * Re-adds the current tab's /_dev/<slot> prefix to a redirect target, so a
 * redirect() call never drops the tab out of its isolated session back
 * onto the shared cookie. No-op outside of /_dev/ testing, including every
 * production request.
 */
export async function slotPath(path: string): Promise<string> {
  const slot = await getDevSlot();
  if (!slot || path.startsWith("/_dev/")) return path;
  return `/_dev/${slot}${path}`;
}
