import { Suspense } from "react";
import Button from "@/components/ui/Button";
import Dropdown from "@/components/ui/Dropdown";
import DatePicker from "@/components/ui/DatePicker";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import BookingConfirmedDialog from "@/components/ui/BookingConfirmedDialog";
import PageTransition from "@/components/ui/PageTransition";
import Skeleton from "@/components/ui/Skeleton";
import { GlassCard } from "@/components/dashboard/glass";
import { getBookingData, type BookSearchParams as BaseBookSearchParams } from "@/app/(site)/book/data";
import { createBookingAt } from "@/app/(site)/book/actions";

type BookSearchParams = BaseBookSearchParams & { error?: string; booked?: string };

// Dashboard-shelled counterpart to the public /book flow — same data layer
// (getBookingData) and the same createBookingAt action (bound to this
// page's own path so errors/success redirect back here, not out to /book),
// just GlassCard/dashboard styling instead of the marketing site's Card.
export default async function CourtBookingPage({
  searchParams,
}: {
  searchParams: Promise<BookSearchParams>;
}) {
  const { error, booked } = await searchParams;

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1000px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Book a Session</h1>
        <p className="mt-1 text-[15px] text-white/60">Pick a court, date, and time that works for you.</p>

        {(booked || error) && <ClearFlashParams params={["booked", "error"]} />}
        {booked && <BookingConfirmedDialog />}
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{error}</p>}

        <Suspense fallback={<BookingSkeleton />}>
          <BookingContent searchParams={searchParams} />
        </Suspense>
      </main>
    </PageTransition>
  );
}

function BookingSkeleton() {
  return (
    <GlassCard className="mt-6" delay={0}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
      </div>
      <Skeleton className="mt-5 h-10 w-40 rounded-full" />
      <div className="mt-8 border-t border-white/10 pt-8">
        <Skeleton className="h-3 w-32 rounded" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[46px] rounded-xl" />
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

async function BookingContent({ searchParams }: { searchParams: Promise<BookSearchParams> }) {
  const { courts, programs, selectedCourt, selectedDate, selectedProgram, slots, selectedSlot, minDate, maxDate } =
    await getBookingData(searchParams);
  const createBooking = createBookingAt.bind(null, "/court-booking");

  const courtName = courts.find((c) => c.id === selectedCourt)?.name ?? "Court";
  const selectedProgramRow = programs.find((p) => p.id === selectedProgram);
  const programTitle = selectedProgramRow?.title ?? "Session";

  function slotHref(startsAt: string | null) {
    const params = new URLSearchParams({ court: selectedCourt, date: selectedDate, program: selectedProgram });
    if (startsAt) params.set("slot", startsAt);
    return `/court-booking?${params.toString()}`;
  }

  return (
    <GlassCard className="mt-6" delay={0}>
      <form method="get" className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="block text-[13px] font-medium text-white/60">Court</span>
          <Dropdown
            name="court"
            defaultValue={selectedCourt}
            className="mt-1.5"
            options={courts.map((c) => ({ value: c.id, label: c.name }))}
            submitOnChange
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-white/60">Date</span>
          <DatePicker name="date" defaultValue={selectedDate} min={minDate} max={maxDate} className="mt-1.5" />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-white/60">Programme</span>
          <Dropdown
            name="program"
            defaultValue={selectedProgram}
            className="mt-1.5"
            options={programs.map((p) => ({ value: p.id, label: p.title }))}
            submitOnChange
          />
        </label>
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
                  {/* Plain <a>, not next-view-transitions' Link — see the
                      matching comment on the public /book page: soft
                      navigation on a searchParams-only change left this
                      Suspense-wrapped content stale. */}
                  <a
                    href={slotHref(isSelected ? null : slot.startsAt)}
                    aria-current={isSelected || undefined}
                    className={`block w-full rounded-xl border py-3 text-center text-[14px] font-medium transition-colors ${
                      isSelected
                        ? "border-emerald bg-emerald-500/15 text-emerald"
                        : "border-white/10 bg-white/5 text-white hover:border-emerald hover:bg-emerald-50 hover:text-navy"
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
      </div>
    </GlassCard>
  );
}
