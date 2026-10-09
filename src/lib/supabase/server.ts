import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { getDevSlot, devSlotCookieOptions } from "@/lib/dev-slot";

/** Server Component / Server Action client. Reads and writes cookies through
 * Next's async cookies() API, so the session survives across requests.
 *
 * Dev-only: when reached through a /_dev/<slot>/... URL (see proxy.ts),
 * this reads and writes that slot's own "sb-dev-<slot>" cookie instead of
 * the cookie every tab otherwise shares, so tabs signed into different
 * roles stay independent on refresh. See src/lib/dev-slot.ts. */
export async function createClient() {
  const cookieStore = await cookies();
  const slot = await getDevSlot();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: devSlotCookieOptions(slot),
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component render, which can't set
            // cookies (there's no response to attach them to yet).
            // proxy.ts refreshes the session on every request instead,
            // so a session write failing here is safe to ignore.
          }
        },
      },
    },
  );
}

/** getUser() is a real network round-trip to Supabase's Auth server (by
 * design — it revalidates the JWT rather than trusting the cookie, unlike
 * getSession()). A layout and its page often both need "who is signed
 * in" in the same request; react's cache() collapses those into one
 * actual call instead of paying that round-trip twice per page load. */
export const getAuthUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/** Nav needs this in two places (the desktop account pill and the mobile
 * menu's sign-out/sign-in item) — cache() means calling it from both only
 * pays the auth round-trip and the profile lookup once per request. */
export const getNavSession = cache(async () => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, intended_role")
    .eq("id", user.id)
    .maybeSingle();

  let dashboardHref = "/dashboard";
  if (profile?.role === "admin") dashboardHref = "/admin";
  else if (profile?.intended_role === "coach") dashboardHref = "/coach";

  return { email: user.email ?? "", fullName: profile?.full_name ?? null, dashboardHref };
});
