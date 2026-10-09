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

function BookingBarSkeleton() {
  return (
    <div className="relative z-20 mx-auto mt-4 w-full max-w-[1400px] px-5 sm:mt-6 sm:px-8">
      <div className="glass-card rounded-2xl border border-white/10 p-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-[repeat(3,1fr)_auto]">
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-14 rounded-xl lg:w-14" />
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px]">
        <Hero />
        {/* BookingBar needs a Supabase round trip (courts + programs) before
            it can render — Suspense here means that wait doesn't block the
            rest of the page's own HTML shell from streaming immediately. */}
        <Suspense fallback={<BookingBarSkeleton />}>
          <BookingBar />
        </Suspense>
        {/* One background for the whole page: the shared gradient lives on
            <body> only. No section paints its own — every band here is
            transparent, so there's one continuous backdrop, not a stack
            of banded panels. */}
        <Suspense
          fallback={
            <div className="py-20 sm:py-28">
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
            <div className="py-20 sm:py-28">
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
