import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
import { site } from "@/content/site";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// latin-ext is required, not optional: the peso sign (U+20B1) sits in
// U+20AD–20CF, outside the latin subset. Without it every ₱ falls back to a
// system font mid-word — most visible on the big Playfair prices.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  style: ["normal", "italic"],
});

const DEFAULT_DESCRIPTION =
  "Book courts by the hour, train with certified coaches, and track your progress session by session.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: site.name,
    // Lets every page set just its own short title ("Book a session") and
    // get the brand suffix for free, instead of every page's own metadata
    // repeating the full name.
    template: `%s · ${site.name}`,
  },
  description: DEFAULT_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_PH",
    title: site.name,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: "/logo.png", width: 840, height: 302, alt: site.name }],
  },
  twitter: {
    card: "summary",
    title: site.name,
    description: DEFAULT_DESCRIPTION,
    images: ["/logo.png"],
  },
};

// schema.org/DayOfWeek by site.hours' own numeric index (0 = Sunday), so
// the JSON-LD opening hours can never drift from what the booking engine
// itself enforces (src/app/(site)/book/availability.ts reads this same
// site.hours table) — the one other place this mapping would need to be
// kept in sync by hand if it lived separately.
const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SportsActivityLocation",
  name: site.name,
  url: siteUrl,
  telephone: site.phone,
  address: {
    "@type": "PostalAddress",
    name: site.address[0],
    streetAddress: site.address[1],
    addressLocality: "Pasig City",
    postalCode: "1605",
    addressRegion: "Metro Manila",
    addressCountry: "PH",
  },
  openingHoursSpecification: site.hours.map((h) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: h.dow.map((d) => `https://schema.org/${SCHEMA_DAYS[d]}`),
    opens: `${String(h.openHour).padStart(2, "0")}:00`,
    closes: `${String(h.closeHour).padStart(2, "0")}:00`,
  })),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ViewTransitions>
      <html
        lang="en"
        className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      >
        <head>
          {/* If the bundle never runs, nothing stays stuck at opacity 0. */}
          <noscript>
            <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
          </noscript>
          {/* dangerouslySetInnerHTML is the documented way to emit JSON-LD —
              structuredData is our own object literal above, never
              user input, so there's nothing here to sanitize. */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        </head>
        <body className="min-h-full flex flex-col bg-navy text-white">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-[15px] focus:font-semibold focus:text-navy"
          >
            Skip to content
          </a>
          {children}
        </body>
      </html>
    </ViewTransitions>
  );
}
