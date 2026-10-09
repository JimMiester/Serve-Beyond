import Logo from "@/components/Logo";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import AdminLoginForm from "./AdminLoginForm";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main id="main" tabIndex={-1} className="flex min-h-svh w-full items-center justify-center px-5">
      <div className="w-full max-w-md">
        <Logo className="mx-auto mb-10 block h-10 w-auto" />

        <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/5 p-8 backdrop-blur-md sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">Restricted access</p>
          <h1 className="mt-2 font-display text-[32px] text-white">Admin sign in</h1>
          <p className="mt-2 text-[15px] text-white/60">For academy staff only.</p>

          {error && (
            <>
              <ClearFlashParams params={["error"]} />
              <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[14px] text-red-300">{error}</p>
            </>
          )}

          <AdminLoginForm />
        </div>
      </div>
    </main>
  );
}
