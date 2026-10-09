import type { Metadata } from "next";
import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import { site } from "@/content/site";
import type { Court } from "@/lib/supabase/types";

export const metadata: Metadata = {
  title: "Our courts",
  description: "Indoor, floodlit, climate-controlled tennis courts at our Metro Manila location. See every court and book one by the hour.",
};

export default async function CourtsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courts").select("*").eq("active", true).order("name");
  if (error) throw error;
  const courts = (data ?? []) as Court[];

  return (
    <PageTransition>
      {/* w-full: <body> is flex flex-col (root layout's sticky-footer
          setup), which makes this <main> a flex item — mx-auto's cross-axis
          auto margins disable flexbox's default stretch sizing (spec:
          auto margins absorb the stretch), so without an explicit w-full
          main falls back to shrink-to-fit its widest descendant instead of
          filling the row and capping at max-w. Never showed up before
          because no page had a non-shrinking wide child until the courts
          scroll row; the whole page grew to fit it instead of the row
          scrolling within itself. */}
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto w-full max-w-[1400px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="The facility"
          title={`${courts.length} ${courts.length === 1 ? "court" : "courts"}, one roof.`}
          lede="Indoor, floodlit, climate controlled. Rain has never cancelled a session here."
          level="h1"
        />

        {/* One horizontal row rather than a wrapping grid — cards stay at
            their full showcase size regardless of how many courts there
            are, and scroll sideways (native overflow-x, no carousel JS)
            instead of shrinking to fit. */}
        <ul className="scroll-row mt-14 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4">
          {courts.map((c) => {
            const image = getPublicImageUrl(c.photo_path);
            return (
              <li key={c.id} className="group w-[320px] shrink-0 snap-start sm:w-[360px]">
                <Card className="overflow-hidden p-0">
                  <div className="relative aspect-[4/3] bg-white/5">
                    {image ? (
                      <Image
                        src={image}
                        alt={c.name}
                        fill
                        sizes="360px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-[20px] font-bold text-white">{c.name}</h3>
                    {c.description && <p className="mt-2 text-[14px] leading-[1.6] text-white/65">{c.description}</p>}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>

        <section className="mt-14">
          <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-white/60">Opening hours</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {site.hours.map((h) => (
              <Card key={h.days} className="p-5">
                <dt className="text-[13px] text-white/60">{h.days}</dt>
                <dd className="mt-1 text-[15px] font-semibold text-white">{h.time}</dd>
              </Card>
            ))}
          </dl>
        </section>
      </main>
    </PageTransition>
  );
}
