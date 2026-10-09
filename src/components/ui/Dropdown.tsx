"use client";

import { useEffect, useRef, useState } from "react";

export type DropdownOption = { value: string; label: string };

const TRIGGER_VARIANTS = {
  // Standalone field: its own border, like the native <select> it replaces.
  bordered:
    "rounded-xl border border-white/15 bg-white/5 px-4 py-3 focus-visible:border-emerald",
  // Embedded in an already-bordered/divided container (e.g. the hero
  // search bar) — no border or background of its own.
  plain:
    "bg-transparent focus-visible:underline focus-visible:decoration-emerald focus-visible:decoration-2 focus-visible:underline-offset-4",
};

/** Custom-styled dropdown that still behaves like a native form field: a
 * hidden input carries `name`/value, so it drops into any existing <form
 * action=...> or <form method="get"> unchanged. Animated with a plain CSS
 * keyframe (see .dropdown-panel-enter in globals.css) — no animation
 * library, consistent with the rest of the site. */
export default function Dropdown({
  name,
  options,
  defaultValue = "",
  placeholder = "Select…",
  variant = "bordered",
  onValueChange,
  className = "",
}: {
  name: string;
  options: DropdownOption[];
  defaultValue?: string;
  placeholder?: string;
  variant?: keyof typeof TRIGGER_VARIANTS;
  onValueChange?: (value: string) => void;
  className?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickAway(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, []);

  const selected = options.find((o) => o.value === value);

  function selectOption(v: string) {
    setValue(v);
    setOpen(false);
    onValueChange?.(v);
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between text-left text-[15px] text-white outline-none transition-colors ${TRIGGER_VARIANTS[variant]}`}
      >
        <span className={`truncate ${selected ? "" : "text-white/40"}`}>{selected?.label ?? placeholder}</span>
        <svg
          width="12"
          height="8"
          viewBox="0 0 12 8"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`ml-2 shrink-0 text-white/40 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1.5 6 6.5 11 1.5" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="dropdown-panel-enter absolute left-0 right-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-auto rounded-xl border border-white/10 bg-navy p-1 shadow-[0_18px_44px_-20px_rgba(0,0,0,0.5)]"
        >
          {options.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                role="option"
                aria-selected={o.value === value}
                onClick={() => selectOption(o.value)}
                className={`block w-full truncate rounded-lg px-3 py-2.5 text-left text-[14px] transition-colors ${
                  o.value === value ? "bg-emerald-500/15 font-semibold text-emerald" : "text-white/75 hover:bg-white/5"
                }`}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
