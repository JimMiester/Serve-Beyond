import PageTransition from "@/components/ui/PageTransition";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import { GlassCard } from "@/components/dashboard/glass";
import { IconUsers } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";
import { setCoachApproval } from "./actions";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" });
}

export default async function CoachApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const { data: profilesData, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .eq("intended_role", "coach")
    .eq("coach_approved", false)
    .order("created_at", { ascending: false });
  if (profilesError) throw profilesError;

  const applicants = (profilesData ?? []) as Profile[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Coach Applications</h1>
        <p className="mt-1 text-[15px] text-white/60">
          Signups waiting on review. Their account already works as a player — approve one to unlock its coach
          dashboard (it then drops off this list), or reject it to leave it as-is. Link an approved account to a
          bio in the coaches directory from /admin/coaches so their sessions show up.
        </p>

        {errorMessage && (
          <>
            <ClearFlashParams params={["error"]} />
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{errorMessage}</p>
          </>
        )}

        <GlassCard className="mt-8" delay={0}>
          {applicants.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-white/55">Nothing waiting on review.</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {applicants.map((a) => {
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 py-5 first:pt-0 last:pb-0">
                    <span
                      className="flex size-11 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      <IconUsers width={18} height={18} />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold text-white">{a.full_name ?? "Unnamed applicant"}</p>
                      <p className="mt-0.5 text-[13px] text-white/50">
                        {a.phone ?? "No phone on file"} · Signed up {formatDate(a.created_at)}
                      </p>
                    </div>

                    <form action={setCoachApproval} className="flex gap-2">
                      <input type="hidden" name="profile_id" value={a.id} />
                      <button
                        type="submit"
                        name="approved"
                        value="false"
                        className="rounded-full px-4 py-2 text-[13px] font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-700"
                      >
                        Reject
                      </button>
                      <button
                        type="submit"
                        name="approved"
                        value="true"
                        className="rounded-full px-4 py-2 text-[13px] font-semibold text-white"
                        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-deep))" }}
                      >
                        Approve
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </GlassCard>
      </main>
    </PageTransition>
  );
}
