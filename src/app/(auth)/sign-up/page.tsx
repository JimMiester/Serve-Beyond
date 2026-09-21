import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { signUp } from "@/lib/supabase/auth-actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main id="main" className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5">
      <Link
        href="/"
        aria-label="Back to homepage"
        className="group fixed left-5 top-5 z-10 flex size-11 items-center justify-center rounded-full border border-navy/8 bg-white text-navy shadow-[0_12px_30px_-14px_rgba(15,36,48,0.35)] transition-colors hover:text-emerald-700 sm:left-8 sm:top-8"
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
          <Logo variant="dark" className="h-10 w-auto" />
        </Link>

        <Card variant="elevated" className="enter-up p-8 sm:p-10">
          <h1 className="font-display text-[32px] text-navy">Create your account</h1>
          <p className="mt-2 text-[15px] text-navy/65">Booking takes a minute once you&rsquo;re signed in.</p>

          {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}

          <form action={signUp} className="mt-8 space-y-4">
            <fieldset>
              <legend className="block text-[13px] font-medium text-navy/70">I&rsquo;m signing up as</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <label className="has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-700 flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 px-4 py-3 text-[15px] font-medium text-navy/70 transition-colors">
                  <input type="radio" name="intended_role" value="player" defaultChecked className="sr-only" />
                  Player
                </label>
                <label className="has-checked:border-emerald-600 has-checked:bg-emerald-50 has-checked:text-emerald-700 flex cursor-pointer items-center justify-center rounded-xl border border-navy/15 px-4 py-3 text-[15px] font-medium text-navy/70 transition-colors">
                  <input type="radio" name="intended_role" value="coach" className="sr-only" />
                  Coach
                </label>
              </div>
              <p className="mt-1.5 text-[13px] text-navy/50">
                Signing up as a coach only flags interest. Listing is at the academy&rsquo;s discretion after review —
                it does not happen automatically.
              </p>
            </fieldset>
            <label className="block">
              <span className="block text-[13px] font-medium text-navy/70">Email</span>
              <input
                type="email"
                name="email"
                required
                className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
              />
            </label>
            <label className="block">
              <span className="block text-[13px] font-medium text-navy/70">Password</span>
              <input
                type="password"
                name="password"
                required
                minLength={8}
                className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald-600"
              />
            </label>
            <Button className="w-full">Create account</Button>
          </form>

          <p className="mt-6 text-center text-[14px] text-navy/60">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-emerald-700">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
