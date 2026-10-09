import type { NextConfig } from "next";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co");

// Report-only for now: Next.js itself injects inline scripts/styles (hydration
// data, the noscript fallback in layout.tsx) that need a nonce-based CSP to
// lock down fully — worth doing, but a bigger lift than this pass. This still
// meaningfully restricts framing, plugins, and which origins the page can
// talk to, and the report-only mode means nothing breaks while it's watched.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: ${supabaseUrl.origin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseUrl.origin}`,
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [new URL(`${supabaseUrl.origin}/storage/v1/object/public/**`)],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Only takes effect over HTTPS — harmless on local HTTP, applies
          // automatically once this is deployed behind TLS.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Content-Security-Policy-Report-Only", value: csp },
        ],
      },
    ];
  },
};

export default nextConfig;
