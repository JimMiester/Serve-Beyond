import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import Skeleton from "@/components/ui/Skeleton";
import { GlassCard, AccentButton } from "@/components/dashboard/glass";
import { IconMapPin } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Court } from "@/lib/supabase/types";

// Dashboard-shelled counterpart to the public /courts showcase — same
// query (active courts), just GlassCard/dashboard styling instead of the
// marketing site's Card, matching how /court-booking relates to /book.
export default async function CourtListPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courts").select("*").eq("active", true).order("name");
  if (error) throw error;
  const courts = (data ?? []) as Court[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1000px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Courts</h1>
        <p className="mt-1 text-[15px] text-white/60">Every court at the academy.</p>

        {courts.length === 0 ? (
          <GlassCard className="mt-8 flex flex-col items-center gap-4 py-14 text-center" delay={0}>
            <span
              className="flex size-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
            >
              <IconMapPin width={24} height={24} />
            </span>
            <h2 className="font-display text-[20px] font-bold text-white">No courts yet</h2>
            <p className="max-w-sm text-[15px] text-white/60">Check back soon.</p>
            <AccentButton href="/dashboard">Back to Dashboard</AccentButton>
          </GlassCard>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {courts.map((c, i) => {
              const image = getPublicImageUrl(c.photo_path);
              return (
                <GlassCard key={c.id} className="overflow-hidden p-0" delay={i * 60}>
                  <div className="relative aspect-[4/3] bg-white/5">
                    {image ? (
                      <Image
                        src={image}
                        alt={c.name}
                        fill
                        sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw"
                        className="object-cover"
                      />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="font-display text-[18px] font-bold text-white">{c.name}</h3>
                    {c.description && <p className="mt-2 text-[14px] text-white/60">{c.description}</p>}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </main>
    </PageTransition>
  );
}
