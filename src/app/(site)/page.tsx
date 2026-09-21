import { Suspense } from "react";
import Hero, { BookingBar } from "@/components/Hero";
import Programs from "@/components/sections/Programs";
import HowItWorks from "@/components/sections/HowItWorks";
import Coaches from "@/components/sections/Coaches";
import Pricing from "@/components/sections/Pricing";
import Proof from "@/components/sections/Proof";
import Faq from "@/components/sections/Faq";
import PageTransition from "@/components/ui/PageTransition";
import Skeleton from "@/components/ui/Skeleton";

export default function Home() {
  return (
    <PageTransition>
      <main id="main">
        <Hero />
        <BookingBar />
        {/* Bands alternate cream / navy so the scroll has rhythm. */}
        <Suspense
          fallback={
            <div className="bg-cream py-20 sm:py-28">
              <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="mt-4 h-10 w-96 max-w-full rounded-lg" />
                <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="aspect-[4/3] rounded-[var(--radius-card)]" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <Programs />
        </Suspense>
        <HowItWorks />
        <Suspense
          fallback={
            <div className="bg-cream py-20 sm:py-28">
              <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
                <Skeleton className="h-4 w-32 rounded" />
                <Skeleton className="mt-4 h-10 w-96 max-w-full rounded-lg" />
                <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {[0, 1, 2].map((i) => (
                    <Skeleton key={i} className="aspect-[4/5] rounded-[var(--radius-card)]" />
                  ))}
                </div>
              </div>
            </div>
          }
        >
          <Coaches />
        </Suspense>
        <Pricing />
        <Proof />
        <Faq />
      </main>
    </PageTransition>
  );
}
