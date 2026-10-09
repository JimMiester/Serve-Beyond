"use client";

import { useEffect, useRef, useState } from "react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function addDays(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function formatFriendly(iso: string, todayISO: string) {
  if (iso === todayISO) return "Today";
  if (iso === addDays(todayISO, 1)) return "Tomorrow";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** Calendar-grid counterpart to Dropdown.tsx — same dark glass panel and
 * hidden-input-carries-the-value trick so it drops into a
 * <form method="get"> unchanged, but a month grid instead of a flat option
 * list. A flat list of every bookable day stops scaling once the range is
 * months wide (scrolling 90 stacked rows to reach "10 weeks out" is worse
 * than a calendar's month-at-a-time navigation); `min` doubles as "today"
 * for the Today/Tomorrow labels and the today-ring, since in this app the
 * earliest bookable day always *is* today.
 *
 * The visible field is a real text input, not a button: focusing it opens
 * the calendar for point-and-click, but typing a date (YYYY-MM-DD) works
 * just as well — clicking a day and typing both just set the same `value`.
 * Typed text is only validated on blur/Enter, not per keystroke, so a
 * still-incomplete date being typed doesn't get stomped mid-edit. */
export default function DatePicker({
  name,
  defaultValue,
  min,
  max,
  className = "",
}: {
  name: string;
  defaultValue: string;
  min: string;
  max: string;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [text, setText] = useState(() => formatFriendly(defaultValue, min));
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(defaultValue.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(defaultValue.slice(5, 7)) - 1);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  function goTo(iso: string) {
    setValue(iso);
    setText(formatFriendly(iso, min));
    setViewYear(Number(iso.slice(0, 4)));
    setViewMonth(Number(iso.slice(5, 7)) - 1);
  }

  // Accepts YYYY-MM-DD only — unambiguous, and it's exactly what the field
  // shows while focused, so there's nothing to guess at.
  function commitTyped(raw: string) {
    const trimmed = raw.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed) && trimmed >= min && trimmed <= max) {
      goTo(trimmed);
    } else {
      setText(formatFriendly(value, min));
    }
  }

  const [minY, minM] = min.split("-").map(Number);
  const [maxY, maxM] = max.split("-").map(Number);
  const atMin = viewYear === minY && viewMonth === minM - 1;
  const atMax = viewYear === maxY && viewMonth === maxM - 1;

  function changeMonth(delta: number) {
    const next = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(next.getUTCFullYear());
    setViewMonth(next.getUTCMonth());
  }

  // 6-week grid starting on the Sunday on/before the 1st of the viewed month.
  const gridStart = new Date(Date.UTC(viewYear, viewMonth, 1));
  gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setUTCDate(d.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    return { iso, inMonth: d.getUTCMonth() === viewMonth, disabled: iso < min || iso > max };
  });

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <input
          type="text"
          aria-haspopup="dialog"
          placeholder="YYYY-MM-DD"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => {
            setText(value);
            setOpen(true);
          }}
          onBlur={(e) => {
            commitTyped(text);
            if (!rootRef.current?.contains(e.relatedTarget)) setOpen(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTyped(text);
            } else if (e.key === "Escape") {
              setText(formatFriendly(value, min));
              setOpen(false);
            }
          }}
          className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 pr-10 text-[15px] text-white outline-none transition-colors focus-visible:border-emerald"
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          onClick={() => setOpen((o) => !o)}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-white/40 transition-colors hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          role="dialog"
          aria-label="Choose a date"
          className="dropdown-panel-enter absolute left-0 top-[calc(100%+6px)] z-30 w-[280px] rounded-xl border border-white/10 bg-navy p-3 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between px-1 pb-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={atMin}
              onClick={() => changeMonth(-1)}
              className="flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 1.5 1.5 6.5 7 11.5" />
              </svg>
            </button>
            <span className="text-[13px] font-semibold text-white">
              {new Date(Date.UTC(viewYear, viewMonth, 1)).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              })}
            </span>
            <button
              type="button"
              aria-label="Next month"
              disabled={atMax}
              onClick={() => changeMonth(1)}
              className="flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-30"
            >
              <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 1.5 6.5 6.5 1 11.5" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="text-[11px] font-semibold text-white/40">
                {w}
              </span>
            ))}
            {days.map(({ iso, inMonth, disabled }) => {
              const isSelected = iso === value;
              const isToday = iso === min;
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    goTo(iso);
                    setOpen(false);
                  }}
                  aria-current={isToday ? "date" : undefined}
                  aria-pressed={isSelected}
                  className={`m-0.5 flex size-8 items-center justify-center rounded-lg text-[13px] transition-colors disabled:pointer-events-none ${
                    !inMonth ? "text-white/20" : disabled ? "text-white/15" : "text-white/80"
                  } ${
                    isSelected
                      ? "bg-emerald-500/15 font-semibold text-emerald"
                      : disabled
                        ? ""
                        : "hover:bg-white/5"
                  } ${isToday && !isSelected ? "ring-1 ring-inset ring-white/25" : ""}`}
                >
                  {Number(iso.slice(8, 10))}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
