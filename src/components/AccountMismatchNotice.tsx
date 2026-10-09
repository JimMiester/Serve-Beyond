import Link from "next/link";
import Logo from "@/components/Logo";
import { signOut } from "@/lib/supabase/auth-actions";

/** A browser cookie holds one session at a time — signing in as a
 * different account in another tab replaces it everywhere, including
 * tabs already open on a different account's page. Rather than silently
 * redirecting a stale tab into a stranger's dashboard on refresh, every
 * protected layout renders this instead of its children when the
 * account it finds doesn't match the section being viewed, so the
 * switch is explicit rather than surprising. */
export default function AccountMismatchNotice({
  email,
  roleLabel,
  continueHref,
  continueLabel,
}: {
  email: string;
  roleLabel: string;
  continueHref: string;
  continueLabel: string;
}) {
  return (
    <main id="main" className="flex min-h-svh w-full items-center justify-center px-5">
      <div className="w-full max-w-md rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md sm:p-10">
        <Link href="/" className="mx-auto mb-6 block w-fit">
          <Logo className="h-10 w-auto" />
        </Link>

        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Account changed</p>
        <h1 className="mt-2 font-display text-[26px] text-white">This browser is signed in as someone else now</h1>
        <p className="mt-3 text-[15px] leading-[1.6] text-white/65">
          <span className="font-semibold text-white">{email}</span> ({roleLabel}) is the active account in this
          browser now — likely from signing in on another tab. A browser can only hold one signed-in account at a
          time, across every tab.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={continueHref}
            className="rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-navy transition-opacity hover:opacity-90"
          >
            {continueLabel}
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="w-full rounded-full border border-white/20 px-6 py-3 text-[14px] font-semibold text-white/80 transition-colors hover:bg-white/5"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
