/** Small stroke-icon set for the dashboard shell — hand-drawn rather than
 * an icon-library dependency, since this is the only place they're used. */
import type { SVGProps } from "react";

function base(props: SVGProps<SVGSVGElement>) {
  return { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
}

export const IconGrid = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

export const IconCalendar = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </svg>
);

export const IconPlusCircle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

export const IconUsers = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c1-3.6 3.6-5.5 6.5-5.5s5.5 1.9 6.5 5.5" />
    <circle cx="17.5" cy="8.5" r="2.4" />
    <path d="M16.3 14.8c2.3.4 4 2.1 4.8 5" />
  </svg>
);

export const IconMapPin = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.4" />
  </svg>
);

export const IconHelp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.3 9.3a2.7 2.7 0 1 1 3.6 2.5c-.7.4-1 .8-1 1.7" />
    <path d="M12 17h.01" />
  </svg>
);

export const IconGear = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 13.5c.06-.5.06-1 0-1.5l1.6-1.4-1.5-2.6-2 .6a7.6 7.6 0 0 0-1.3-.75L15.8 5.5h-3l-.4 2.35a7.6 7.6 0 0 0-1.3.75l-2-.6-1.5 2.6 1.6 1.4a5.9 5.9 0 0 0 0 1.5l-1.6 1.4 1.5 2.6 2-.6c.4.3.85.55 1.3.75l.4 2.35h3l.4-2.35c.45-.2.9-.45 1.3-.75l2 .6 1.5-2.6-1.6-1.4Z" />
  </svg>
);

export const IconLogOut = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const IconBook = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  </svg>
);

export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </svg>
);

export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </svg>
);

export const IconTrendUp = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 17 12 11l3 3 5-6" />
    <path d="M15 8h5v5" />
  </svg>
);
