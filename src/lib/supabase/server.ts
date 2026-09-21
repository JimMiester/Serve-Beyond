import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Server Component / Server Action client. Reads and writes cookies through
 * Next's async cookies() API, so the session survives across requests. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
