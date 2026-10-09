import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Program } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Classes & pricing",
  description: "One format for every kind of player, from a first private lesson to a standing group clinic. See every class and its price.",
};

export default async function ClassesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select("*").order("price_from");
  if (error) throw error;
  const programs = (data ?? []) as Program[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[1400px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Classes & pricing"
          title="A format for every kind of player."
          lede="From your first private lesson to a standing group clinic, every session is built around one court, one price, no surprises."
          level="h1"
        />

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((p) => {
            const image = getPublicImageUrl(p.photo_path);
            return (
              <li key={p.id}>
                <Link href={`/classes/${p.slug}`} className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald">
                  <Card className="h-full overflow-hidden p-0 transition-transform duration-200 active:scale-[0.99]">
                    <div className="relative aspect-[4/3] w-full bg-white/5">
                      {image ? (
                        <Image src={image} alt="" fill sizes="(min-width:1024px) 23vw, (min-width:640px) 46vw, 92vw" className="object-cover" />
                      ) : (
                        <Skeleton className="absolute inset-0" />
                      )}
                    </div>
                    <div className="p-6">
                      <p className="font-display text-[20px] font-bold text-white">{p.title}</p>
                      {p.blurb && <p className="mt-2 text-[14px] leading-[1.6] text-white/65">{p.blurb}</p>}
                      <p className="mt-4 text-[15px] font-semibold text-emerald">
                        From ₱{p.price_from.toLocaleString()} / {p.price_unit}
                      </p>
                    </div>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </PageTransition>
  );
}
