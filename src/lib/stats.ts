import { createClient } from "@/lib/supabase/server";
import { stats as placeholderStats } from "@/content/site";

/** Courts and coaches are counted live — site.ts's own numbers for these
 * two used to just be invented ("Eight courts" shown above a /courts page
 * that only ever had 3), which is the kind of thing a visitor can
 * disprove in one click. Active members and years coaching have no table
 * to count from, so those two stay as placeholderStats' labeled-invented
 * values until there's a real number to put there. Shared by the landing
 * page's Proof section and /results, so both show the same real numbers
 * instead of each computing its own. Falls back to the placeholder
 * figures on a Supabase error rather than crashing the caller. */
export async function getStats() {
  try {
    const supabase = await createClient();
    const [{ count: courtCount }, { count: coachCount }] = await Promise.all([
      supabase.from("courts").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("coaches").select("*", { count: "exact", head: true }).eq("active", true),
    ]);

    return placeholderStats.map((s) => {
      if (s.label === "Indoor courts" && courtCount != null) return { ...s, value: String(courtCount) };
      if (s.label === "Certified coaches" && coachCount != null) return { ...s, value: String(coachCount) };
      return s;
    });
  } catch (error) {
    console.error(error);
    return placeholderStats;
  }
}
