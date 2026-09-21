import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { signUp } from "@/lib/supabase/auth-actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main id="main" className="mx-auto flex min-h-svh max-w-md flex-col justify-center px-5">
      <Link href="/" className="mx-auto mb-10">
        <Logo variant="dark" className="h-10 w-auto" />
      </Link>

      <h1 className="font-display text-[32px] text-navy">Create your account</h1>
      <p className="mt-2 text-[15px] text-navy/65">Booking takes a minute once you&rsquo;re signed in.</p>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}

      <form action={signUp} className="mt-8 space-y-4">
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
    </main>
  );
}
