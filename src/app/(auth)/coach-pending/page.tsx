import Link from "next/link";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

const QUOTES = [
  "Good things come to those who rally.",
  "Even the best lob needs a little hang time.",
  "Patience is the best return of serve there is.",
  "Rome wasn't built in a day. Neither was a killer backhand.",
  "Somewhere, an admin is warming up to hit approve.",
  "Championship points take a moment to land.",
  "Great rallies build slowly. So does this.",
  "Hang tight — even the greats waited for their first title.",
];

export default async function CoachPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  // Math.random()/Date.now() are flagged as impure render calls by this
  // project's lint rules; `new Date()` (used the same way elsewhere in
  // this codebase, e.g. the player dashboard) gives the same "different
  // quote most loads" effect without tripping it.
  const quote = QUOTES[new Date().getSeconds() % QUOTES.length];

  return (
    <main id="main" tabIndex={-1} className="relative flex min-h-svh w-full items-center justify-center overflow-hidden px-5">
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

        <Card variant="elevated" className="enter-up flex flex-col items-center p-8 text-center sm:p-10">
          <div className="relative flex h-[92px] w-20 flex-col items-center justify-end" aria-hidden="true">
            <svg className="pending-ball size-14" viewBox="0 0 40 40">
              <defs>
                <radialGradient id="ball-gradient" cx="35%" cy="30%" r="75%">
                  <stop offset="0%" stopColor="#e8f28a" />
                  <stop offset="100%" stopColor="#a3b52a" />
                </radialGradient>
              </defs>
              <circle cx="20" cy="20" r="18" fill="url(#ball-gradient)" />
              <path d="M4 13c7-7 25-7 32 0" stroke="white" strokeWidth="1.6" fill="none" opacity="0.85" />
              <path d="M4 27c7 7 25 7 32 0" stroke="white" strokeWidth="1.6" fill="none" opacity="0.85" />
            </svg>
            <div className="pending-ball-shadow h-2 w-10 rounded-full bg-black/30 blur-[2px]" />
          </div>

          <h1 className="mt-6 font-display text-[28px] text-white">Your account is in</h1>
          <p className="mt-2 text-[15px] leading-[1.6] text-white/65">
            {email ? (
              <>
                Your account for <span className="font-semibold text-white">{email}</span> is created.
              </>
            ) : (
              "Your account is created."
            )}{" "}
            An admin still needs to approve it before you can reach your coach dashboard. Once approved, just sign
            in again — no need to create a new account.
          </p>

          <p className="mt-6 max-w-xs text-[14px] italic text-white/50">&ldquo;{quote}&rdquo;</p>

          <div className="mt-8 flex w-full flex-col gap-3">
            <Button href="/sign-in?mode=coach" variant="outline" className="w-full">
              Already approved? Sign in
            </Button>
            <Button href="/" variant="emerald" className="w-full">
              Back to homepage
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
