/** The site's own public URL — used for metadataBase, canonicals,
 * robots.txt, sitemap.xml and JSON-LD. Falls back to localhost so dev
 * and local production builds work with no setup; set NEXT_PUBLIC_SITE_URL
 * to the real domain once this is actually deployed, or every one of
 * those stays pointed at localhost. */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
