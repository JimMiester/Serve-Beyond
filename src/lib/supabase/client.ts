import { createBrowserClient } from "@supabase/ssr";

/** Browser-side client. Only used where a client component genuinely needs
 * one — everything else in this project reads via server.ts. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
