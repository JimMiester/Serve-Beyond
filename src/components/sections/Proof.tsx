import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";
import { createClient } from "@/lib/supabase/server";
import { stats as placeholderStats, testimonials } from "@/content/site";

// Courts and coaches are counted live — site.ts's own numbers for these
// two used to just be invented ("Eight courts" shown above a /courts page
// that only ever had 3), which is the kind of thing a visitor can
// disprove in one click. Active members and years coaching have no table
// to count from, so those two stay as placeholderStats' labeled-invented
// values until there's a real number to put there.
async function getStats() {
  const supabase = await createClient();
  const [{ count: courtCount }, { count: coachCount }] = await Promise.all([
    supabase.from("courts").select("*", { count: "exact", head: true }).eq("active", true),
    supabase.from("coaches").select("*", { count: "exact", head: true }).eq("active", true),
  ]);

  return placeholderStats.map((s) => {
    if (s.label === "Indoor courts" && courtCount != null) return { ...s, value: String(courtCount) };
    if (s.label === "Certified coaches" && coachCount != null) return { ...s, value: String(coachCount) };
    return s;
  });
}

export default async function Proof() {
  // Falls back to the placeholder figures rather than taking down the
  // whole landing page — same reasoning as Hero/Programs/Coaches hiding
  // on a Supabase error, just a fallback here instead of hiding, since a
  // stat tile with no number at all reads as broken in a way an empty
  // section doesn't.
  const stats = await getStats().catch((error) => {
    console.error(error);
    return placeholderStats;
  });

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        {/* Was a hairline grid via gap-px + a solid bg-navy match on each
            cell — that trick needed a flat color identical to the section
            background, which no longer exists now that the section sits
            on the shared body gradient. Four separate glass-card tiles
            instead, the same surface the dashboard's stat cards and this
            page's Nav use. */}
        <Reveal as="dl" stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="glass-card rounded-[var(--radius-card)] border border-white/10 px-6 py-8 text-center sm:py-10"
            >
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp
                  value={s.value}
                  className="block font-display text-[clamp(2.5rem,5vw,3.25rem)] leading-none text-white"
                />
                <span className="mt-3 block text-[13px] uppercase tracking-[0.16em] text-emerald">{s.label}</span>
              </dd>
            </div>
          ))}
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid gap-8 lg:grid-cols-2 lg:gap-12">
          {testimonials.map((t) => (
            <li key={t.name}>
              <figure>
                <blockquote className="font-display text-[clamp(1.35rem,2.4vw,1.75rem)] leading-[1.4] text-white">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold" aria-hidden="true" />
                  <span className="text-[15px] font-semibold text-white">{t.name}</span>
                  <span className="text-[14px] text-white/55">{t.detail}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
