import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { steps } from "@/content/site";

export default function HowItWorks() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            title="Booked in under a minute."
            lede="No membership gate, no phone calls, no waiting to hear back from the desk."
          />
        </Reveal>

        {/* Same swap as Proof: the gap-px + solid-bg-navy hairline grid needed
            a flat color matching the section background, which the gradient
            no longer has. Glass-card tiles instead. */}
        <Reveal as="ol" stagger className="mt-14 grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="glass-card rounded-[var(--radius-card)] border border-white/10 p-8 sm:p-10">
              <span className="font-display text-[44px] leading-none text-emerald" aria-hidden="true">
                {s.n}
              </span>
              <h3 className="mt-6 text-[19px] font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-white/65">{s.body}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
