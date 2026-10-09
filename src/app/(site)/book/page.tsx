import { Suspense } from "react";
import type { Metadata } from "next";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import SectionHead from "@/components/ui/SectionHead";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import BookingConfirmedDialog from "@/components/ui/BookingConfirmedDialog";
import PageTransition from "@/components/ui/PageTransition";
import Skeleton from "@/components/ui/Skeleton";
import { getBookingData, type BookSearchParams as BaseBookSearchParams } from "./data";
import { createBooking } from "./actions";

type BookSearchParams = BaseBookSearchParams & { error?: string; booked?: string };

export const metadata: Metadata = {
  title: "Book a session",
  description: "Pick a court, a day, and a programme — open slots show up right away, up to 3 months ahead.",
};

// One page, one card: every field already has a sane default (today, the
// first court, the first program), so a multi-step wizard was adding clicks
// a booking this short never needed. Changing a field just re-submits this
// same GET form and the slot grid updates below it — no separate steps.
export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<BookSearchParams>;
}) {
  const { error, booked } = await searchParams;

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="scroll-mt-[60px] mx-auto max-w-[720px] px-5 pb-24 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Book a session"
          title="Pick a time, walk on court."
          lede="Choose a court, a day, and a programme — open slots show up right below."
          level="h1"
        />

        {(booked || error) && <ClearFlashParams params={["booked", "error"]} />}
        {booked && <BookingConfirmedDialog />}
        {error && <p className="mt-6 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{error}</p>}

        {/*
          The filter form and slot grid both need the same Supabase round
          trips (auth, courts, programs, existing bookings). Splitting them
          into their own async component behind Suspense means this page's
          shell — the part next-view-transitions needs to paint to satisfy
          the browser's View Transition DOM-update timeout — commits
          immediately on navigation, instead of the whole route blocking on
          four sequential/parallel DB calls first.
        */}
        <Suspense fallback={<BookingSkeleton />}>
          <BookingContent searchParams={searchParams} />
        </Suspense>
      </main>
    </PageTransition>
  );
}

function BookingSkeleton() {
  return (
    <Card className="mt-10 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
        <Skeleton className="h-[68px] rounded-xl" />
      </div>
      <Skeleton className="mt-5 h-11 w-40 rounded-full" />
      <div className="mt-8 border-t border-white/10 pt-8">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[46px] rounded-xl" />
          ))}
        </div>
      </div>
    </Card>
  );
}

async function BookingContent({ searchParams }: { searchParams: Promise<BookSearchParams> }) {
  const { user, courts, programs, selectedCourt, selectedDate, selectedProgram, slots, selectedSlot, minDate, maxDate } =
    await getBookingData(searchParams);

  const courtName = courts.find((c) => c.id === selectedCourt)?.name ?? "Court";
  const selectedProgramRow = programs.find((p) => p.id === selectedProgram);
  const programTitle = selectedProgramRow?.title ?? "Session";

  // A slot link carries the current filters forward plus which slot is
  // picked (or none, to let the player change their mind) — same idea as
  // the Court/Date/Programme fields, just expressed as a link instead of a
  // form field, since picking a slot doesn't need its own round trip of
  // re-fetching anything.
  function slotHref(startsAt: string | null) {
    const params = new URLSearchParams({ court: selectedCourt, date: selectedDate, program: selectedProgram });
    if (startsAt) params.set("slot", startsAt);
    return `/book?${params.toString()}`;
  }

  return (
    <Card className="mt-10 p-6 sm:p-8">
      <form method="get" className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="block text-[13px] font-medium text-white/70">Court</span>
          <Dropdown
            name="court"
            defaultValue={selectedCourt}
            className="mt-1.5"
            options={courts.map((c) => ({ value: c.id, label: c.name }))}
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-white/70">Date</span>
          <DatePicker
            name="date"
            defaultValue={selectedDate}
            min={minDate}
            max={maxDate}
            className="mt-1.5"
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-white/70">Programme</span>
          <Dropdown
            name="program"
            defaultValue={selectedProgram}
            className="mt-1.5"
            options={programs.map((p) => ({ value: p.id, label: p.title }))}
          />
        </label>
        <Button size="sm" variant="outline" className="sm:col-span-3">
          Check availability
        </Button>
      </form>

      <div className="mt-8 border-t border-white/10 pt-8">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-white/50">
          Available times, {selectedDate}
        </h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-[15px] text-white/60">No open slots this day. Try another date.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {slots.map((slot) => {
              const isSelected = slot.startsAt === selectedSlot?.startsAt;
              return (
                <li key={slot.startsAt}>
                  {/* Plain <a>, not next-view-transitions' Link: this only
                      changes the ?slot= query param, and the client router's
                      soft navigation was leaving the Suspense-wrapped
                      content stale (URL updated, confirm card didn't) — a
                      real <form method="get"> field-change elsewhere on
                      this page always does a full navigation and doesn't
                      hit that, so a real navigation here matches it. */}
                  <a
                    href={slotHref(isSelected ? null : slot.startsAt)}
                    aria-current={isSelected || undefined}
                    className={`block w-full rounded-xl border py-3 text-center text-[14px] font-medium transition-colors ${
                      isSelected
                        ? "border-emerald bg-emerald-500/15 text-emerald"
                        : "border-white/15 text-white hover:border-emerald hover:bg-emerald-50 hover:text-navy"
                    }`}
                  >
                    {slot.label}
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Always visible, not just once a slot is picked — this is the
          booking flow's natural end point, so it reads as part of the
          page rather than something that pops in. Nothing actually books
          until Confirm is pressed and enabled, which only happens once a
          time is selected above. */}
      <div className="mt-8 rounded-xl border border-emerald/30 bg-emerald-500/5 p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-emerald">Confirm your booking</h2>
        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[14px] sm:grid-cols-5">
          <div>
            <dt className="text-white/50">Court</dt>
            <dd className="font-semibold text-white">{courtName}</dd>
          </div>
          <div>
            <dt className="text-white/50">Date</dt>
            <dd className="font-semibold text-white">{selectedDate}</dd>
          </div>
          <div>
            <dt className="text-white/50">Time</dt>
            <dd className={selectedSlot ? "font-semibold text-white" : "text-white/40"}>
              {selectedSlot ? selectedSlot.label : "Pick a time above"}
            </dd>
          </div>
          <div>
            <dt className="text-white/50">Programme</dt>
            <dd className="font-semibold text-white">{programTitle}</dd>
          </div>
          <div>
            <dt className="text-white/50">Price</dt>
            <dd className="font-semibold text-white">
              {selectedProgramRow ? `₱${selectedProgramRow.price_from.toLocaleString()} / ${selectedProgramRow.price_unit}` : "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {selectedSlot ? (
            <>
              <form action={createBooking}>
                <input type="hidden" name="court_id" value={selectedCourt} />
                <input type="hidden" name="program_id" value={selectedProgram} />
                <input type="hidden" name="date" value={selectedDate} />
                <input type="hidden" name="starts_at" value={selectedSlot.startsAt} />
                <input type="hidden" name="ends_at" value={selectedSlot.endsAt} />
                <Button size="sm">Confirm booking</Button>
              </form>
              <a href={slotHref(null)} className="text-[14px] font-medium text-white/60 hover:text-white">
                Change time
              </a>
            </>
          ) : (
            <Button size="sm" disabled>
              Confirm booking
            </Button>
          )}
        </div>

        {!user && selectedSlot && (
          <p className="mt-4 text-center text-[14px] text-white/60">
            Confirming will ask you to{" "}
            <a
              href={`/sign-in?next=${encodeURIComponent(slotHref(selectedSlot.startsAt))}`}
              className="font-semibold text-emerald"
            >
              sign in
            </a>
            . You&rsquo;ll land right back here with this slot still selected.
          </p>
        )}
      </div>
    </Card>
  );
}
