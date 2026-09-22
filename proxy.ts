import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request. Without this,
 * Server Components can read a stale or expired token — middleware is the
 * only place that runs early enough to refresh it before a page renders.
 *
 * Also redirects a signed-in-but-unverified user away from /account and
 * /book to /verify. This checks the auth session's own
 * email_confirmed_at, never a profiles-table lookup — an unverified user
 * has no profiles row yet (see 0003_otp_signup.sql).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const { data } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith("/account") || path.startsWith("/book");
  if (data.user && !data.user.email_confirmed_at && isProtected) {
    const redirectResponse = NextResponse.redirect(
      new URL(`/verify?email=${encodeURIComponent(data.user.email ?? "")}`, request.url),
    );
    for (const cookie of response.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
