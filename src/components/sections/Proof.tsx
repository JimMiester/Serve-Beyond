import CountUp from "@/components/ui/CountUp";
import Reveal from "@/components/ui/Reveal";
import { stats, testimonials } from "@/content/site";

export default function Proof() {
  return (
    <section className="bg-navy py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal as="dl" stagger className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="bg-navy px-6 py-8 text-center sm:py-10">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <CountUp
                  value={s.value}
                  className="block font-display text-[clamp(2.5rem,5vw,3.25rem)] leading-none text-white"
                />
                <span className="mt-3 block text-[13px] uppercase tracking-[0.16em] text-sky">{s.label}</span>
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
                  <span className="text-[14px] text-cream/55">{t.detail}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
