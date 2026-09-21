import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import Button from "@/components/ui/Button";
import { pricing } from "@/content/site";

export default function Pricing() {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="Pricing"
            title="Pay per hour, or settle in."
            lede="No joining fee and no contract. Membership only pays for itself if you are here most weeks, and we will tell you if it does not."
          />
        </Reveal>

        <Reveal as="ul" stagger className="mt-14 grid items-start gap-6 lg:grid-cols-3">
          {pricing.map((p) => (
            <li
              key={p.tier}
              className={
                p.featured
                  ? "rounded-2xl bg-navy p-8 text-white shadow-[0_24px_60px_-24px_rgba(15,36,48,0.55)] sm:p-10 lg:-mt-6"
                  : "rounded-2xl border border-navy/10 bg-cream p-8 sm:p-10"
              }
            >
              <div className="flex items-center justify-between gap-4">
                <h3
                  className={`text-[13px] font-semibold uppercase tracking-[0.16em] ${
                    p.featured ? "text-sky" : "text-emerald-700"
                  }`}
                >
                  {p.tier}
                </h3>
                {p.featured && (
                  <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-bold uppercase tracking-[0.1em] text-navy">
                    Most booked
                  </span>
                )}
              </div>

              <p className="mt-6 flex items-baseline gap-2">
                <span className={`font-display text-[46px] leading-none ${p.featured ? "text-white" : "text-navy"}`}>
                  {p.price}
                </span>
                <span className={`text-[14px] ${p.featured ? "text-cream/60" : "text-navy/55"}`}>{p.unit}</span>
              </p>
              <p className={`mt-3 text-[15px] ${p.featured ? "text-cream/70" : "text-navy/65"}`}>{p.note}</p>

              <ul className={`mt-8 space-y-3 border-t pt-8 ${p.featured ? "border-white/15" : "border-navy/10"}`}>
                {p.features.map((f) => (
                  <li key={f} className="flex gap-3 text-[15px] leading-[1.5]">
                    <svg
                      width="17"
                      height="17"
                      viewBox="0 0 17 17"
                      aria-hidden="true"
                      fill="none"
                      stroke={p.featured ? "#5bc0eb" : "#006b4a"}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mt-0.5 shrink-0"
                    >
                      <path d="m3.5 9 3.5 3.5 6.5-8" />
                    </svg>
                    <span className={p.featured ? "text-cream/85" : "text-navy/75"}>{f}</span>
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
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
