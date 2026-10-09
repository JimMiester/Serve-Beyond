import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import SignUpForm from "./SignUpForm";

export const metadata: Metadata = {
  title: "Create account",
  robots: { index: false, follow: false },
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>;
}) {
  const { error, email } = await searchParams;

  return (
    <main id="main" tabIndex={-1} className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5">
      <Link
        href="/"
        aria-label="Back to homepage"
        className="group fixed left-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-white/8 bg-white text-navy shadow-[0_12px_30px_-14px_rgba(15,36,48,0.35)] transition-colors hover:text-emerald sm:left-8 sm:top-8"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="transition-transform duration-200 group-hover:-translate-x-0.5"
        >
          <path d="M15 9H3" />
          <path d="m7.5 4.5-4.5 4.5 4.5 4.5" />
        </svg>
      </Link>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-[8%] size-72 rounded-full bg-emerald/25 blur-3xl sm:size-96"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-[10%] size-80 rounded-full bg-sky/20 blur-3xl sm:size-[28rem]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-10%] size-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl sm:size-96"
      />

      <div className="relative w-full max-w-md">
        <Link href="/" className="mx-auto mb-10 block w-fit">
          <Logo className="h-10 w-auto" />
        </Link>

        <Card variant="elevated" className="enter-up p-8 sm:p-10">
          <h1 className="font-display text-[32px] text-white">Create your account</h1>
          <p className="mt-2 text-[15px] text-white/65">Booking takes a minute once you&rsquo;re signed in.</p>

          {error && <ClearFlashParams params={["error"]} />}
          <SignUpForm initialEmail={email ?? ""} error={error} />

          <p className="mt-6 text-center text-[14px] text-white/60">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-emerald">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
