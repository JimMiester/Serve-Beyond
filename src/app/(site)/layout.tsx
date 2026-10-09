import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";

// Nav resolves its own session (see getNavSession, Suspense-wrapped inside
// it) — this layout renders immediately instead of awaiting auth first, so
// every page under it starts its own data fetching in parallel with Nav's
// session lookup rather than waiting behind it.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      {children}
      <Footer />
    </>
  );
}
