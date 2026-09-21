const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Builds a public Storage URL from a stored `photo_path`, or null if there
 * is none yet — callers render a <Skeleton> in that case, same as today. */
export function getPublicImageUrl(path: string | null): string | null {
  if (!path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/public-media/${path}`;
}
