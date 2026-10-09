import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import { GlassCard } from "@/components/dashboard/glass";
import { IconUsers } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Coach, Profile } from "@/lib/supabase/types";
import { updateCoach, deleteCoach } from "./actions";
import AddCoachForm from "./AddCoachForm";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-white/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald";
const LABEL = "block text-[13px] font-medium text-white/70";

function CoachFields({ coach }: { coach?: Coach }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="block">
        <span className={LABEL}>Name</span>
        <input name="name" defaultValue={coach?.name} required className={FIELD} />
      </label>
      <label className="block">
        <span className={LABEL}>Role / title</span>
        <input name="role" defaultValue={coach?.role} required className={FIELD} />
      </label>
      <label className="block">
        <span className={LABEL}>Certification</span>
        <input name="cert" defaultValue={coach?.cert ?? ""} className={FIELD} />
      </label>
      <label className="block">
        <span className={LABEL}>Years of experience</span>
        <input name="years" type="number" min="0" defaultValue={coach?.years ?? ""} className={FIELD} />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>Focus / bio</span>
        <textarea name="focus" rows={2} defaultValue={coach?.focus ?? ""} className={FIELD} />
      </label>
      <label className="block sm:col-span-2">
        <span className={LABEL}>Photo{coach ? " (leave blank to keep current)" : ""}</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="mt-1.5 block w-full cursor-pointer text-[14px] text-white/70 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[color:var(--accent)] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white file:transition-opacity hover:file:opacity-90"
        />
      </label>
      <label className="flex items-center gap-2 sm:col-span-2">
        <input type="checkbox" name="active" defaultChecked={coach?.active ?? true} className="size-4 rounded border-white/30" />
        <span className="text-[14px] text-white/70">Active (shown on the public site)</span>
      </label>
    </div>
  );
}

export default async function AdminCoachesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const [{ data, error }, { data: profilesData, error: profilesError }] = await Promise.all([
    supabase.from("coaches").select("*").order("name"),
    supabase
      .from("profiles")
      .select("*")
      .eq("coach_approved", true)
      .eq("intended_role", "coach")
      .order("created_at", { ascending: false }),
  ]);
  if (error) throw error;
  if (profilesError) throw profilesError;
  const coaches = (data ?? []) as Coach[];
  const approvedProfiles = (profilesData ?? []) as Profile[];

  // Only accounts not already tied to a bio are worth offering here —
  // one already linked has nothing left to "add".
  const linkedProfileIds = new Set(coaches.map((c) => c.profile_id).filter(Boolean));
  const availableAccounts = approvedProfiles
    .filter((p) => !linkedProfileIds.has(p.id))
    .map((p) => ({ id: p.id, full_name: p.full_name }));

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Coaches</h1>
        <p className="mt-1 text-[15px] text-white/60">{coaches.length} coaches on record. Changes here update /coaching right away.</p>

        {errorMessage && (
          <>
            <ClearFlashParams params={["error"]} />
            <p role="alert" className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{errorMessage}</p>
          </>
        )}

        <GlassCard className="mt-8" delay={0}>
          <details>
            <summary className="cursor-pointer text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">+ Add a coach</summary>
            <AddCoachForm accounts={availableAccounts} />
          </details>
        </GlassCard>

        <GlassCard className="mt-6" delay={60}>
          {coaches.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-white/55">No coaches yet.</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {coaches.map((c) => {
                const image = getPublicImageUrl(c.photo_path);
                return (
                  <li key={c.id} className="py-4 first:pt-0 last:pb-0">
                    <details>
                      <summary className="flex cursor-pointer list-none items-center gap-4 [&::-webkit-details-marker]:hidden">
                        <span
                          className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full"
                          style={{ backgroundColor: "var(--accent-soft)" }}
                        >
                          {image ? (
                            <Image src={image} alt="" fill sizes="44px" className="object-cover" />
                          ) : (
                            <IconUsers width={18} height={18} className="text-[color:var(--accent)]" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <p className="text-[15px] font-semibold text-white">{c.name}</p>
                            <p className="text-[13px] text-white/50">
                              {c.role}
                              {c.cert ? `, ${c.cert}` : ""}
                            </p>
                          </div>
                          <p className="mt-0.5 truncate text-[13px] text-white/50">
                            {c.focus ?? "—"}
                            {c.years != null ? ` · ${c.years} yrs` : ""}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${c.active ? "text-emerald" : "text-white/50"}`}
                          style={{ backgroundColor: c.active ? "var(--accent-soft)" : "rgba(255,255,255,0.08)" }}
                        >
                          {c.active ? "Active" : "Inactive"}
                        </span>
                      </summary>
                      <form action={updateCoach} className="mt-4 space-y-4 border-t border-white/8 pt-4">
                        <input type="hidden" name="coach_id" value={c.id} />
                        <CoachFields coach={c} />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5"
                          >
                            Save changes
                          </button>
                          <button
                            type="submit"
                            formAction={deleteCoach}
                            className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-red-400 transition-colors hover:bg-red-50 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </form>
                    </details>
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
