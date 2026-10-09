"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from 0 to `value` on mount. Snaps instantly under
 * prefers-reduced-motion via duration 0, still routed through the same
 * rAF tick() rather than a separate setState-on-mount branch (this
 * project's ESLint config flags a direct setState in an effect body). */
export function StatNumber({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduced ? 0 : 700;
    const start = performance.now();
    let raf: number;
    function tick(now: number) {
      const progress = duration === 0 ? 1 : Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
}

type DayBar = { label: string; hours: number; isToday: boolean };

/** Bars grow from 0 to their real height on mount (0% on first paint, then
 * the CSS transition carries them up), and scale up + brighten on hover. */
export function WeeklyChart({ days }: { days: DayBar[] }) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const max = Math.max(1, ...days.map((d) => d.hours));

  return (
    <div className="flex h-40 items-end justify-between gap-2 sm:gap-4">
      {days.map((d) => {
        const heightPct = grown ? Math.max(d.hours > 0 ? 8 : 3, (d.hours / max) * 100) : 0;
        return (
          <div key={d.label} className="group flex h-full flex-1 flex-col items-center gap-2">
            <span className="text-[12px] font-semibold" style={d.isToday ? { color: "var(--accent)" } : { color: "rgba(255,255,255,0.4)" }}>
              {d.hours > 0 ? `${d.hours}h` : "—"}
            </span>
            <div className="flex w-full flex-1 items-end overflow-visible">
              <div
                className="w-full origin-bottom rounded-t-lg backdrop-blur-sm transition-[height,transform,filter] duration-700 ease-out group-hover:scale-y-105 group-hover:brightness-110"
                style={{
                  height: `${heightPct}%`,
                  background: d.isToday
                    ? "linear-gradient(180deg, var(--accent), var(--accent-light))"
                    : "rgba(255, 255, 255, 0.1)",
                }}
              />
            </div>
            <span className="text-[12px] font-medium" style={d.isToday ? { color: "#ffffff" } : { color: "rgba(255,255,255,0.5)" }}>
              {d.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Donut split of a player's confirmed bookings by real status — Completed
 * (ended), In Progress (happening right now), Pending (upcoming). Segments
 * animate their length in on mount via stroke-dasharray. */
export function SessionRing({
  completed,
  inProgress,
  pending,
}: {
  completed: number;
  inProgress: number;
  pending: number;
}) {
  const total = completed + inProgress + pending;
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const size = 168;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments =
    total > 0
      ? [
          { key: "completed", value: completed, color: "var(--accent)" },
          { key: "inProgress", value: inProgress, color: "#5bc0eb" },
          { key: "pending", value: pending, color: "rgba(255, 255, 255, 0.18)" },
        ]
      : [{ key: "empty", value: 1, color: "rgba(255, 255, 255, 0.08)" }];

  let drawn = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        {segments.map((seg) => {
          const fraction = seg.value / (total || 1);
          const dashLength = grown ? fraction * circumference : 0;
          const offset = -drawn;
          drawn += fraction * circumference;
          return (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={stroke}
              strokeLinecap="round"
              style={{
                stroke: seg.color,
                strokeDasharray: `${dashLength} ${circumference - dashLength}`,
                strokeDashoffset: offset,
                transition: "stroke-dasharray 0.8s ease-out",
              }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[28px] font-extrabold text-white">
          <StatNumber value={total} />
        </span>
        <span className="text-[12px] text-white/50">sessions</span>
      </div>
    </div>
  );
}
