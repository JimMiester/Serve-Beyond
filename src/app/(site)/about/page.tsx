import type { Metadata } from "next";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Why Serve & Beyond exists: real court and coach availability enforced server-side, no double bookings, no subscription fees.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="About us"
          title="Court time that raises your whole game."
          lede="Serve & Beyond grew out of a simple frustration: the hardest part of playing more tennis was never the tennis. It was the group chats, the double bookings, the coach who had already promised that slot to someone else."
          level="h1"
        />

        <div className="mt-14 space-y-6 text-[17px] leading-[1.75] text-white/75">
          <p>
            So we built the booking we wanted. Every court and every coach at our Metro Manila location in one
            place, real availability instead of a wish, and a slot that&rsquo;s yours the moment you take it — enforced
            at the database, not just the screen, so nobody ever gets double-booked into a lesson that was already
            promised to someone else.
          </p>
          <p>
            Our coaches set their own hours, their own rate, and their own week. Nobody books them into a holiday, and
            nobody has to chase them for a reschedule. If a coach shows as open, they&rsquo;re open.
          </p>
          <p>
            There&rsquo;s no subscription and no booking fee. You pay for court time and coaching, and that&rsquo;s it.
          </p>
        </div>

        <Card className="mt-14 grid gap-8 p-8 sm:grid-cols-3 sm:p-10">
          <div>
            <p className="font-display text-[32px] font-extrabold text-white">3 taps</p>
            <p className="mt-1 text-[14px] text-white/60">to a confirmed court or coaching slot</p>
          </div>
          <div>
            <p className="font-display text-[32px] font-extrabold text-white">0 clashes</p>
            <p className="mt-1 text-[14px] text-white/60">because availability is enforced server-side</p>
          </div>
          <div>
            <p className="font-display text-[32px] font-extrabold text-white">24/7</p>
            <p className="mt-1 text-[14px] text-white/60">access to your sessions and court time</p>
          </div>
        </Card>
      </main>
    </PageTransition>
  );
}
