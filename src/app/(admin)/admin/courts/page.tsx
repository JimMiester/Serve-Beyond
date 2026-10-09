import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import ClearFlashParams from "@/components/ui/ClearFlashParams";
import { GlassCard } from "@/components/dashboard/glass";
import { IconMapPin } from "@/components/dashboard/icons";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Court } from "@/lib/supabase/types";
import { createCourt, updateCourt, deleteCourt } from "./actions";

const FIELD =
  "mt-1.5 w-full rounded-xl border border-white/15 px-4 py-3 text-[15px] outline-none focus-visible:border-emerald";
const LABEL = "block text-[13px] font-medium text-white/70";

function CourtFields({ court }: { court?: Court }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <label className="block">
        <span className={LABEL}>Name</span>
        <input name="name" defaultValue={court?.name} required className={FIELD} />
      </label>
      <label className="block">
        <span className={LABEL}>Description</span>
        <textarea name="description" rows={2} defaultValue={court?.description ?? ""} className={FIELD} />
      </label>
      <label className="block">
        <span className={LABEL}>Photo{court ? " (leave blank to keep current)" : ""}</span>
        <input
          name="photo"
          type="file"
          accept="image/*"
          className="mt-1.5 block w-full cursor-pointer text-[14px] text-white/70 file:mr-4 file:cursor-pointer file:rounded-full file:border-0 file:bg-[color:var(--accent)] file:px-4 file:py-2 file:text-[13px] file:font-semibold file:text-white file:transition-opacity hover:file:opacity-90"
        />
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" name="active" defaultChecked={court?.active ?? true} className="size-4 rounded border-white/30" />
        <span className="text-[14px] text-white/70">Active (shown on the public site)</span>
      </label>
    </div>
  );
}

export default async function AdminCourtsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMessage } = await searchParams;

  const supabase = await createClient();
  const { data, error } = await supabase.from("courts").select("*").order("name");
  if (error) throw error;
  const courts = (data ?? []) as Court[];

  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1400px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Courts</h1>
        <p className="mt-1 text-[15px] text-white/60">{courts.length} courts on record. Changes here update /courts right away.</p>

        {errorMessage && (
          <>
            <ClearFlashParams params={["error"]} />
            <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-3 text-[15px] text-red-300">{errorMessage}</p>
          </>
        )}

        <GlassCard className="mt-8" delay={0}>
          <details>
            <summary className="cursor-pointer text-[15px] font-semibold text-white [&::-webkit-details-marker]:hidden">+ Add a court</summary>
            <form action={createCourt} className="mt-4 space-y-4 border-t border-white/8 pt-4">
              <CourtFields />
              <button
                type="submit"
                className="rounded-full px-5 py-2.5 text-[14px] font-semibold text-white"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-deep))" }}
              >
                Add court
              </button>
            </form>
          </details>
        </GlassCard>

        <GlassCard className="mt-6" delay={60}>
          {courts.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-white/55">No courts yet.</p>
          ) : (
            <ul className="divide-y divide-white/8">
              {courts.map((c) => {
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
                            <IconMapPin width={18} height={18} className="text-[color:var(--accent)]" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[15px] font-semibold text-white">{c.name}</p>
                          <p className="mt-0.5 truncate text-[13px] text-white/50">{c.description ?? "—"}</p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-semibold ${c.active ? "text-emerald" : "text-white/50"}`}
                          style={{ backgroundColor: c.active ? "var(--accent-soft)" : "rgba(255,255,255,0.08)" }}
                        >
                          {c.active ? "Active" : "Inactive"}
                        </span>
                      </summary>
                      <form action={updateCourt} className="mt-4 space-y-4 border-t border-white/8 pt-4">
                        <input type="hidden" name="court_id" value={c.id} />
                        <CourtFields court={c} />
                        <div className="flex flex-wrap gap-3">
                          <button
                            type="submit"
                            className="rounded-full border border-white/15 px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/5"
                          >
                            Save changes
                          </button>
                          <button
                            type="submit"
                            formAction={deleteCourt}
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
