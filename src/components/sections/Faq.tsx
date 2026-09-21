import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import Button from "@/components/ui/Button";
import { faqs, site } from "@/content/site";

export default function Faq() {
  return (
    <section id="faqs" className="bg-cream py-20 sm:py-28">
      <Reveal className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <SectionHead eyebrow="FAQs" title="Before you book." />
          <p className="mt-5 text-[17px] leading-[1.65] text-navy/70">
            Still stuck? The desk answers the phone between 8am and 8pm, every day.
          </p>
          <Button href={`tel:${site.phone.replace(/\s/g, "")}`} variant="outline" className="mt-7">
            {site.phone}
          </Button>
        </div>

        {/* Native <details> — an accordion is not worth a client bundle. */}
        <div className="lg:col-span-7 lg:col-start-6">
          {faqs.map((f) => (
            <details key={f.q} className="disclosure group border-b border-navy/12 first:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="relative size-5 shrink-0 text-emerald-700 transition-transform duration-300 group-open:rotate-45"
                >
                  <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current" />
                  <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded bg-current" />
                </span>
              </summary>
              <p className="pb-7 pr-10 text-[16px] leading-[1.7] text-navy/70">{f.a}</p>
            </details>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
