import Skeleton from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import Card from "@/components/ui/Card";
import Image from "next/image";
import SectionHead from "@/components/ui/SectionHead";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Coach } from "@/lib/supabase/types";

export default async function Coaches() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("coaches").select("*").eq("active", true).order("years", { ascending: false });
  // Hide the section rather than crash the whole landing page if Supabase is unreachable.
  if (error) {
    console.error(error);
    return null;
  }
  const coaches = (data ?? []) as Coach[];

  return (
    <section id="coaches" className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-8">
          <SectionHead
            eyebrow="The coaches"
            title="Certified, and still competing."
            lede="Every coach on this floor holds a current governing-body certification and plays league tennis themselves."
          />
          <Button href="/coaching" variant="outline" className="shrink-0">
            All coaches
          </Button>
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => {
            const image = getPublicImageUrl(c.photo_path);
            return (
              <li key={c.id} className="group">
                <Card className="relative aspect-[4/5] overflow-hidden">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${c.name}, ${c.role}`}
                      fill
                      sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Skeleton className="absolute inset-0" />
                  )}
                </Card>

                <div className="mt-5 flex items-baseline justify-between gap-4">
                  <h3 className="font-display text-[23px] leading-tight text-white">{c.name}</h3>
                  <span className="shrink-0 text-[13px] font-medium text-white/50">{c.years} yrs</span>
                </div>

                {/* The one gold detail in this section. */}
                <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald">
                  <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                  {c.cert ? `${c.role}, ${c.cert}` : c.role}
                </p>
                <p className="mt-2 text-[15px] leading-[1.6] text-white/65">{c.focus}</p>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
