import type { Metadata } from "next";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import { getStats } from "@/lib/stats";
import { testimonials } from "@/content/site";

export const metadata: Metadata = {
  title: "Results",
  description: "What members actually say about training and playing at Serve & Beyond.",
  alternates: { canonical: "/results" },
};

export default async function ResultsPage() {
  const stats = await getStats();

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Results"
          title="What members actually say."
          lede="No leaderboard, no tournament bracket yet — just the people who kept showing up."
          level="h1"
        />

        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(2rem,4vw,2.75rem)] leading-none text-white">
                  {s.value}
                </span>
                <span className="mt-2 block text-[13px] uppercase tracking-[0.14em] text-emerald">
                  {s.label}
                </span>
              </dd>
            </Card>
          ))}
        </dl>

        <ul className="mt-10 space-y-6">
          {testimonials.map((t) => (
            <li key={t.name}>
              <Card className="p-8">
                <figure>
                  <blockquote className="font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.4] text-white">
                    <p>&ldquo;{t.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption className="mt-5 flex items-center gap-3">
                    <span className="h-px w-8 bg-gold" aria-hidden="true" />
                    <span className="text-[15px] font-semibold text-white">{t.name}</span>
                    <span className="text-[14px] text-white/55">{t.detail}</span>
                  </figcaption>
                </figure>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </PageTransition>
  );
}
