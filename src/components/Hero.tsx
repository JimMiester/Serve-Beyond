import { createClient } from "@/lib/supabase/server";
import type { Court, Program } from "@/lib/supabase/types";
import { Link } from "next-view-transitions";
import Dropdown from "@/components/ui/Dropdown";

export default function Hero() {
  return (
    <section className="relative isolate flex min-h-svh flex-col justify-end overflow-hidden pt-[72px]">
      {/*
        No photograph yet. This section paints nothing of its own — the dark,
        steel-blue-glow gradient and grain both live on <body> (globals.css),
        so the whole page is one continuous backdrop instead of a copy
        re-declared per section. When the real shot lands, introduce a scrim
        sized to that image rather than giving this section its own fill.
      */}

      {/* Bottom padding trimmed: the booking bar used to tuck into this space,
          and without that overlap the old pb-36 left a dead gap below the CTA. */}
      <div className="mx-auto w-full max-w-[1400px] px-5 pb-20 sm:px-8 lg:pb-24">
        <div className="grid items-end gap-10 lg:grid-cols-12 lg:gap-x-8">
          {/* Lines rise in sequence. Above the fold, so it is a plain CSS
              animation — no observer, no client JS. */}
          <h1 className="font-display text-[clamp(2.75rem,7.2vw,4rem)] leading-[0.98] tracking-[-0.015em] text-white lg:col-span-6">
            <span className="enter-up block">Court Time That</span>
            <span className="enter-up block" style={{ animationDelay: "110ms" }}>
              <em className="italic">Raises</em> Your
            </span>
            <span className="enter-up block" style={{ animationDelay: "220ms" }}>
              Whole Game.
            </span>
          </h1>

          <div className="lg:col-span-5 lg:col-start-8 lg:pb-2">
            <p
              className="enter-up max-w-md text-[16px] leading-[1.6] text-white/70"
              style={{ animationDelay: "380ms" }}
            >
              Book courts by the hour, train with certified coaches, and track
              your progress session by session.
            </p>

            <Link
              href="/book"
              style={{ animationDelay: "480ms" }}
              className="glass-sweep enter-up group mt-7 inline-flex items-center gap-4 rounded-full py-1.5 pl-7 pr-1.5 text-[15px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              Book a Session
              {/* The focal moment: a serve. The badge winds up and releases
                  just after the pill fades in — the follow-through of the
                  swing "Raises" already promised — then a hover nudges it
                  back, ready for another. One gesture, reused as both
                  entrance and feedback, not two separate effects. */}
              <span
                className="cta-badge flex size-11 items-center justify-center rounded-full text-white transition-transform duration-300 group-hover:-rotate-12"
                style={{ animationDelay: "560ms", backgroundColor: "var(--accent)" }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 11.5 11.5 3.5M5 3.5h6.5V10" />
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FIELD =
  "w-full bg-transparent text-[15px] font-medium text-white outline-none focus-visible:underline focus-visible:decoration-emerald focus-visible:decoration-2 focus-visible:underline-offset-4";
const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45";

/** Sits below the hero on the page's dark gradient — deliberately clear of the edge. */
export async function BookingBar() {
  const supabase = await createClient();
  const [
    { data: courtsData, error: courtsError },
    { data: programsData, error: programsError },
  ] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  // Hide the bar rather than crash the whole landing page if Supabase is unreachable.
  if (courtsError || programsError) {
    console.error(courtsError ?? programsError);
    return null;
  }
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  return (
    <div
      className="enter-up relative z-20 mx-auto mt-4 w-full max-w-[1400px] px-5 sm:mt-6 sm:px-8"
      style={{ animationDelay: "600ms" }}
    >
      {/* Dark glass, same recipe as .glass-card: a frosted lift off the page
          gradient rather than an opaque fill, so the form reads as part of
          this dark surface instead of a bright cutout. */}
      <form
        action="/book"
        className="glass-card rounded-2xl border border-white/10 shadow-[0_18px_44px_-24px_rgba(0,0,0,0.5)]"
      >
        {/* Three fields, not four: exact time-slot picking depends on real
            availability, which can't live in a plain <select> — that choice
            happens on /book itself. This bar's job is just to route there. */}
        <div className="grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 lg:grid-cols-[repeat(3,1fr)_auto] lg:divide-x lg:divide-y-0">
          <label className="block px-6 py-4">
            <span className={LABEL}>Court</span>
            <Dropdown
              name="court"
              variant="plain"
              className="mt-1.5"
              defaultValue={courts[0]?.id ?? ""}
              options={courts.map((c) => ({ value: c.id, label: c.name }))}
            />
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Date</span>
            <input type="date" name="date" className={`${FIELD} mt-1.5`} />
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Session Type</span>
            <Dropdown
              name="program"
              variant="plain"
              className="mt-1.5"
              defaultValue={programs[0]?.id ?? ""}
              options={programs.map((p) => ({ value: p.id, label: p.title }))}
            />
          </label>

          <div className="flex items-center justify-end p-3">
            <button
              type="submit"
              aria-label="Search availability"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald lg:w-14"
            >
              <svg width="19" height="19" viewBox="0 0 19 19" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="8" cy="8" r="6" />
                <path d="m12.5 12.5 4 4" />
              </svg>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
