import Skeleton from "@/components/ui/Skeleton";
import Reveal from "@/components/ui/Reveal";
import Card from "@/components/ui/Card";
import Image from "next/image";
import { Link } from "next-view-transitions";
import SectionHead from "@/components/ui/SectionHead";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Program } from "@/lib/supabase/types";

export default async function Programs() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select("*").order("price_from", { ascending: true });
  // Hide the section rather than crash the whole landing page if Supabase is unreachable.
  if (error) {
    console.error(error);
    return null;
  }
  const programs = (data ?? []) as Program[];

  return (
    <section id="programs" className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Programmes"
            title="Four ways onto a court."
            lede="Whether you are chasing a county ranking or just want a rally that lasts more than four shots, one of these fits."
          />
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {programs.map((p) => {
            const image = getPublicImageUrl(p.photo_path);
            return (
              <li key={p.slug}>
                <Link
                  href={`/classes/${p.slug}`}
                  className="group block rounded-2xl transition-transform duration-200 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald"
                >
                  <Card className="relative aspect-[4/3] overflow-hidden">
                    {image ? (
                      <Image
                        src={image}
                        alt=""
                        fill
                        sizes="(min-width:1024px) 23vw, (min-width:640px) 46vw, 92vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                    <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-white/[0.06]" />
                  </Card>

                  <h3 className="mt-5 font-display text-[22px] leading-tight text-white">{p.title}</h3>
                  <p className="mt-2 text-[15px] leading-[1.6] text-white/65">{p.blurb}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald">
                    From ₱{p.price_from.toLocaleString()} / {p.price_unit}
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 13 13"
                      aria-hidden="true"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    >
                      <path d="M2.5 10.5 10.5 2.5M4 2.5h6.5V9" />
                    </svg>
                  </span>
                </Link>
              </li>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
