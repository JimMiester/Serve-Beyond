import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { steps } from "@/content/site";

export default function HowItWorks() {
  return (
    <section className="bg-navy py-20 sm:py-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <Reveal>
          <SectionHead
            eyebrow="How it works"
            title="Booked in under a minute."
            lede="No membership gate, no phone calls, no waiting to hear back from the desk."
            tone="dark"
          />
        </Reveal>

        <Reveal as="ol" stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="bg-navy p-8 sm:p-10">
              <span className="font-display text-[44px] leading-none text-sky" aria-hidden="true">
                {s.n}
              </span>
              <h3 className="mt-6 text-[19px] font-semibold text-white">{s.title}</h3>
              <p className="mt-3 text-[15px] leading-[1.65] text-cream/65">{s.body}</p>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
