import type { Metadata } from "next";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import { faqs } from "@/content/site";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Rackets, booking windows, cancellations, and more — everything to know before you book a court or a class.",
  alternates: { canonical: "/faqs" },
};

export default function FaqsPage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[800px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead eyebrow="FAQs" title="Before you book." level="h1" />

        <div className="mt-10">
          {faqs.map((f) => (
            <details key={f.q} className="disclosure group border-b border-white/12 first:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="relative size-5 shrink-0 text-emerald transition-transform duration-300 group-open:rotate-45"
                >
                  <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current" />
                  <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded bg-current" />
                </span>
              </summary>
              <p className="pb-7 pr-10 text-[16px] leading-[1.7] text-white/70">{f.a}</p>
            </details>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
