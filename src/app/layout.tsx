import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ViewTransitions } from "next-view-transitions";
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

export const metadata: Metadata = {
  title: "Serve & Beyond Tennis Academy",
  description:
    "Book courts by the hour, train with certified coaches, and track your progress session by session.",
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
