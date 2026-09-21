import { createClient } from "@/lib/supabase/server";
import type { Court, Program } from "@/lib/supabase/types";
import { Link } from "next-view-transitions";

export default function Hero() {
  return (
    <section className="grain relative isolate flex min-h-svh flex-col justify-end overflow-hidden bg-navy pt-[72px]">
      {/*
        No photograph yet. The graded gradient below carries the hero on its
        own; when the real shot lands — indoor facility, floor-to-ceiling glass,
        low angle, coach adjusting a player's grip — add an <Image fill> here
        above the gradient and the scrim will grade it without further changes.
      */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(120%_90%_at_78%_18%,#2f6f8f_0%,#173b55_38%,#0b1b2b_78%)]"
      />

      {/* Cool grade: shadows toward navy with a faint emerald cast. */}
      <div aria-hidden className="absolute inset-0 -z-20 bg-navy/25 mix-blend-multiply" />
      <div aria-hidden className="absolute inset-0 -z-20 bg-emerald/15 mix-blend-soft-light" />

      {/* Scrim: heavy bottom-left and top edge, near-transparent through upper right. */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(11,27,43,0.88)_0%,rgba(11,27,43,0.15)_52%,transparent_70%),linear-gradient(to_right,rgba(11,27,43,0.72)_0%,transparent_58%),linear-gradient(to_bottom,rgba(11,27,43,0.62)_0%,transparent_24%)]"
      />

      {/* Light bloom where the sun hits the glass. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-16 -z-10 size-[560px] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.28),transparent_68%)] blur-2xl mix-blend-screen"
      />

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
              className="enter-up max-w-md text-[16px] leading-[1.6] text-cream/75"
              style={{ animationDelay: "380ms" }}
            >
              Book courts by the hour, train with certified coaches, and track
              your progress session by session.
            </p>

            <Link
              href="/book"
              style={{ animationDelay: "480ms" }}
              className="enter-up group mt-7 inline-flex items-center gap-4 rounded-full bg-emerald-600 py-1.5 pl-7 pr-1.5 text-[15px] font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky"
            >
              Book a Session
              {/* The focal moment: a serve. The badge winds up and releases
                  just after the pill fades in — the follow-through of the
                  swing "Raises" already promised — then a hover nudges it
                  back, ready for another. One gesture, reused as both
                  entrance and feedback, not two separate effects. */}
              <span
                className="cta-badge flex size-11 items-center justify-center rounded-full bg-navy transition-transform duration-300 group-hover:-rotate-12"
                style={{ animationDelay: "560ms" }}
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
  "w-full bg-transparent text-[15px] font-medium text-navy outline-none focus-visible:underline focus-visible:decoration-emerald focus-visible:decoration-2 focus-visible:underline-offset-4";
const LABEL = "block text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45";

/** Sits below the hero on the cream band — deliberately clear of the edge. */
export async function BookingBar() {
  const supabase = await createClient();
  const [
    { data: courtsData, error: courtsError },
    { data: programsData, error: programsError },
  ] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  if (courtsError) throw courtsError;
  if (programsError) throw programsError;
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  return (
    <div
      className="enter-up relative z-20 mx-auto mt-8 w-full max-w-[1400px] px-5 sm:mt-10 sm:px-8"
      style={{ animationDelay: "600ms" }}
    >
      {/* Opaque white, not translucent cream: it now sits ON cream, so the card
          needs its own value to separate from the band behind it. */}
      <form
        action="/book"
        className="rounded-2xl border border-navy/10 bg-white shadow-[0_18px_44px_-24px_rgba(11,27,43,0.30)]"
      >
        {/* Three fields, not four: exact time-slot picking depends on real
            availability, which can't live in a plain <select> — that choice
            happens on /book itself. This bar's job is just to route there. */}
        <div className="grid grid-cols-1 divide-y divide-navy/10 sm:grid-cols-3 lg:grid-cols-[repeat(3,1fr)_auto] lg:divide-x lg:divide-y-0">
          <label className="block px-6 py-4">
            <span className={LABEL}>Court</span>
            <select name="court" className={`${FIELD} mt-1.5`} defaultValue={courts[0]?.id ?? ""}>
              {courts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Date</span>
            <input type="date" name="date" className={`${FIELD} mt-1.5`} />
          </label>

          <label className="block px-6 py-4">
            <span className={LABEL}>Session Type</span>
            <select name="program" className={`${FIELD} mt-1.5`} defaultValue={programs[0]?.id ?? ""}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
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
