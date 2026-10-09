import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Every authenticated-only area — these have no SEO value and
        // nothing a crawler reaches here would differ per-visitor anyway,
        // since the page itself redirects a signed-out crawler to sign-in.
        disallow: [
          "/dashboard",
          "/bookings",
          "/court-booking",
          "/court-list",
          "/coaches",
          "/help",
          "/admin",
          "/admin-login",
          "/coach",
          "/coach-pending",
          "/sign-in",
          "/sign-up",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
