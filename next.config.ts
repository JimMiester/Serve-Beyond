import type { NextConfig } from "next";

const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [new URL(`${supabaseUrl.origin}/storage/v1/object/public/**`)],
  },
};

export default nextConfig;
