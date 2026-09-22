import Link from "next/link";
import Logo from "@/components/Logo";
import Card from "@/components/ui/Card";
import VerifyForm from "./VerifyForm";

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; sent?: string }>;
}) {
  const { email, error, sent } = await searchParams;
  const safeEmail = email ?? "";

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
          <h1 className="font-display text-[32px] text-navy">Check your email</h1>
          <p className="mt-2 text-[15px] text-navy/65">
            We sent a 6-digit code to <span className="font-semibold text-navy">{maskEmail(safeEmail)}</span>.
          </p>

          <VerifyForm email={safeEmail} error={error} sent={sent === "1"} />

          <p className="mt-6 text-center text-[14px] text-navy/60">
            Wrong email?{" "}
            <Link
              href={`/sign-up?email=${encodeURIComponent(safeEmail)}`}
              className="font-semibold text-emerald-700"
            >
              Change email
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
