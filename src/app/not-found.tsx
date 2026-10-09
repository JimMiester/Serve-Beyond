import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="mx-auto flex min-h-[70svh] max-w-[560px] flex-col items-center justify-center px-5 text-center sm:px-8">
      <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-emerald">404</p>
      <h1 className="mt-2 font-display text-[clamp(1.75rem,4vw,2.25rem)] text-white">Page not found</h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-white/65">
        That page doesn&rsquo;t exist, or it moved. Check the link, or head back to the homepage.
      </p>
      <Link
        href="/"
        className="mt-7 rounded-full bg-emerald-600 px-7 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald"
      >
        Back home
      </Link>
    </main>
  );
}
