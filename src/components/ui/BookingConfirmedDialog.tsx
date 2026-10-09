"use client";

import { useEffect, useRef } from "react";

/** Native <dialog> rather than a hand-rolled overlay: showModal() gives
 * focus-trapping, Esc-to-close and a ::backdrop for free, no extra state
 * or a click-outside listener to maintain. Mounted only when the booked
 * flash param is present (see /book and /court-booking), so it always
 * opens fresh on mount — no visible prop needed. */
export default function BookingConfirmedDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby="booking-confirmed-title"
      // m-auto: dialog:modal centers itself via the UA stylesheet's auto
      // margins, but Tailwind's preflight resets margin to 0 on every
      // element first, which cancels that out — without this it opens
      // pinned to the top-left corner instead of centered.
      className="m-auto rounded-2xl border border-white/10 bg-navy p-0 text-white shadow-[0_24px_64px_-24px_rgba(0,0,0,0.6)] backdrop:bg-black/60 open:animate-[dialog-in_0.2s_ease-out_both]"
      onClick={(e) => {
        if (e.target === ref.current) ref.current?.close();
      }}
    >
      <div className="w-[min(90vw,380px)] p-6 text-center sm:p-8">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald">
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 13.5 11 18.5 20 8.5" />
          </svg>
        </span>
        <h2 id="booking-confirmed-title" className="mt-4 font-display text-[20px] font-bold text-white">
          Booking confirmed
        </h2>
        <p className="mt-2 text-[15px] text-white/65">We&rsquo;ll see you on the court.</p>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-7 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald"
        >
          Got it
        </button>
      </div>
    </dialog>
  );
}
