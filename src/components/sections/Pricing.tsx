import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { pricing } from "@/content/site";

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Pricing"
            title="Pay per hour."
            lede="No joining fee, no contract, no minimum. Book a court or a lesson whenever you want one."
          />
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {pricing.map((p) => (
            <li key={p.tier}>
              <Card
                variant={p.featured ? "featured" : "default"}
                className={p.featured ? "p-8 sm:p-10 lg:-mt-6" : "p-8 sm:p-10"}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-[13px] font-semibold uppercase tracking-[0.16em] text-emerald">
                    {p.tier}
                  </h3>
                  {p.featured && (
                    <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-navy">
                      Most booked
                    </span>
                  )}
                </div>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-[46px] leading-none text-white">{p.price}</span>
                  <span className="text-[14px] text-white/55">{p.unit}</span>
                </p>
                <p className="mt-3 text-[15px] text-white/65">{p.note}</p>

                <ul className="mt-8 space-y-3 border-t border-white/10 pt-8">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-3 text-[15px] leading-[1.5]">
                      <svg
                        width="17"
                        height="17"
                        viewBox="0 0 17 17"
                        aria-hidden="true"
                        fill="none"
                        stroke="#00a878"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 shrink-0"
                      >
                        <path d="m3.5 9 3.5 3.5 6.5-8" />
                      </svg>
                      <span className="text-white/75">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  href="/book"
                  variant={p.featured ? "emerald" : "outline"}
                  className="mt-8 w-full"
                >
                  {p.cta}
                </Button>
              </Card>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
