import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Coach, Program } from "@/lib/supabase/types";

type ProgramRow = Program & { coaches: Coach | null };

// Same select string as the page component's own query below, so Next
// dedupes the two into one Supabase round trip within this request.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("programs").select("*, coaches(*)").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Class not found" };
  return {
    title: data.title,
    description: data.blurb ?? `${data.title} at Serve & Beyond Tennis Academy.`,
    alternates: { canonical: `/classes/${slug}` },
  };
}

export default async function ClassDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("programs").select("*, coaches(*)").eq("slug", slug).maybeSingle();
  if (error) throw error;
  if (!data) notFound();
  const program = data as ProgramRow;

  const image = getPublicImageUrl(program.photo_path);
  const coachImage = program.coaches ? getPublicImageUrl(program.coaches.photo_path) : null;

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[900px] px-5 pb-24 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Classes & pricing"
          title={program.title}
          lede={program.blurb ?? undefined}
          level="h1"
        />

        <Card className="mt-10 overflow-hidden p-0">
          <div className="aspect-[16/9] w-full bg-white/5">
            {image ? (
              <Image
                src={image}
                alt={program.title}
                width={900}
                height={506}
                sizes="(min-width:900px) 900px, 100vw"
                className="size-full object-cover"
              />
            ) : (
              <Skeleton className="absolute inset-0" />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <p className="text-[18px] font-semibold text-emerald">
              ₱{program.price_from.toLocaleString()} / {program.price_unit}
              <span className="ml-2 text-[13px] font-normal text-white/50">up to {program.capacity} {program.capacity === 1 ? "player" : "players"} per slot</span>
            </p>
            <Button href={`/book?program=${program.id}`}>Book this programme</Button>
          </div>
        </Card>

        {program.coaches && (
          <Card className="mt-6 flex items-center gap-4 p-5">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-white/5">
              {coachImage ? (
                <Image src={coachImage} alt={program.coaches.name} fill sizes="56px" className="object-cover" />
              ) : (
                <Skeleton className="absolute inset-0" />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold uppercase tracking-[0.1em] text-white/50">Coached by</p>
              <p className="mt-0.5 truncate text-[16px] font-semibold text-white">{program.coaches.name}</p>
            </div>
          </Card>
        )}

        <p className="mt-8">
          <Link href="/classes" className="text-[14px] font-medium text-white/60 hover:text-white">
            ← All classes
          </Link>
        </p>
      </main>
    </PageTransition>
  );
}
