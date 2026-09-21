import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import { stats, testimonials } from "@/content/site";

export default function ResultsPage() {
  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Results"
          title="What members actually say."
          lede="No leaderboard, no tournament bracket yet — just the people who kept showing up."
        />

        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(2rem,4vw,2.75rem)] leading-none text-navy">
                  {s.value}
                </span>
                <span className="mt-2 block text-[13px] uppercase tracking-[0.14em] text-emerald-700">
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
                <blockquote className="font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.4] text-navy">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold" aria-hidden="true" />
                  <span className="text-[15px] font-semibold text-navy">{t.name}</span>
                  <span className="text-[14px] text-navy/55">{t.detail}</span>
                </figcaption>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </PageTransition>
  );
}
