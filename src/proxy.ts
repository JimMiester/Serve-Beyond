import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refreshes the Supabase session cookie on every request. Without this,
 * Server Components can read a stale or expired token — middleware is the
 * only place that runs early enough to refresh it before a page renders.
 *
 * Also forwards the request path as an x-pathname header — a Server
 * Component layout has no other way to read the current URL (usePathname()
 * is client-only), and (dashboard)/layout.tsx needs it so its sign-in
 * redirect's ?next= points back at whichever page was actually requested,
 * not a hardcoded route.
 *
 * This file must live at src/proxy.ts, not the project root — this project
 * puts all app code under src/ (see the "@/*" -> "./src/*" tsconfig path),
 * and Next.js only picks up middleware/proxy from the project root OR
 * from src/ when a src directory is in use, never both. A root-level
 * proxy.ts alongside a src/ layout is silently never invoked at all.
 *
 * Dev-only tab isolation: a request under /_dev/<slot>/... (slot is any
 * short label, e.g. "player" / "coach" / "admin") is rewritten to its real
 * path and given its own Supabase auth cookie ("sb-dev-<slot>" instead of
 * the shared cookie every tab otherwise reads), so logging into
 * localhost:3000/_dev/player/..., /_dev/coach/... and /_dev/admin/... in
 * three separate tabs keeps each tab's session independent on refresh.
 * The rest of the app never sees the /_dev/<slot> prefix — it's stripped
 * before the request reaches routing — it only sees x-dev-slot via
 * src/lib/dev-slot.ts. Disabled outside development, so production
 * behaves exactly as before and can't be reached through a /_dev/ URL.
 *
 * The bare /_dev launcher page (links to open all three slots) is
 * rewritten to src/app/dev-launcher rather than living in src/app/_dev:
 * Next.js treats any App Router folder starting with "_" as a private,
 * unrouted folder, so a page actually placed at src/app/_dev/page.tsx can
 * never be served — the external /_dev URL only works by being rewritten
 * here, same as the slotted URLs below.
 */
const DEV_SLOT_RE = /^\/_dev\/([a-zA-Z0-9_-]+)(\/.*)?$/;

export async function proxy(request: NextRequest) {
  const url = request.nextUrl;
  let pathname = url.pathname;
  let slot: string | null = null;

  if (process.env.NODE_ENV !== "production") {
    if (pathname === "/_dev" || pathname === "/_dev/") {
      pathname = "/dev-launcher";
    } else {
      const match = DEV_SLOT_RE.exec(pathname);
      if (match) {
        slot = match[1];
        pathname = match[2] && match[2] !== "" ? match[2] : "/";
      }
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (slot) {
    requestHeaders.set("x-dev-slot", slot);
  } else {
    // Strip anything a request tried to set itself — x-dev-slot is only
    // ever meant to come from this rewrite, never from the client.
    requestHeaders.delete("x-dev-slot");
  }

  const rewriteUrl = pathname !== url.pathname ? new URL(pathname + url.search, request.url) : null;

  let response = rewriteUrl
    ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
    : NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: slot ? { name: `sb-dev-${slot}` } : undefined,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          response = rewriteUrl
            ? NextResponse.rewrite(rewriteUrl, { request: { headers: requestHeaders } })
            : NextResponse.next({ request: { headers: requestHeaders } });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  await supabase.auth.getUser();

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
