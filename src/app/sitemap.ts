import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/book",
    "/courts",
    "/coaching",
    "/classes",
    "/faqs",
    "/results",
  ].map((path) => ({ url: `${siteUrl}${path}`, lastModified: new Date() }));

  const supabase = await createClient();
  const { data: programs } = await supabase.from("programs").select("slug");
  const classPages: MetadataRoute.Sitemap = (programs ?? []).map((p) => ({
    url: `${siteUrl}/classes/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticPages, ...classPages];
}
