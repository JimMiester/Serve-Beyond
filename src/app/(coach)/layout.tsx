import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getDevSlot, slotPath } from "@/lib/dev-slot";
import CoachSidebar from "@/components/dashboard/CoachSidebar";
import TopBar from "@/components/dashboard/TopBar";
import AccountMismatchNotice from "@/components/AccountMismatchNotice";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    redirect(await slotPath("/sign-in?mode=coach&next=/coach"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, intended_role, coach_approved")
    .eq("id", user.id)
    .maybeSingle();

  // Mirrors the player dashboard's guard: an admin or player account never
  // falls through to the coach dashboard, even reached directly — including
  // a different account signing in on another tab of this browser.
  if (profile?.role === "admin") {
    return (
      <AccountMismatchNotice
        email={user.email ?? ""}
        roleLabel="Admin"
        continueHref={await slotPath("/admin")}
        continueLabel="Continue to Admin"
      />
    );
  }
  if (profile?.intended_role !== "coach") {
    return (
      <AccountMismatchNotice
        email={user.email ?? ""}
        roleLabel="Player"
        continueHref={await slotPath("/dashboard")}
        continueLabel="Continue to Dashboard"
      />
    );
  }
  // Not a different account — the same coach just isn't approved yet, so
  // a plain redirect (not a mismatch notice) is the right call here.
  if (!profile?.coach_approved) {
    redirect(await slotPath(`/coach-pending?email=${encodeURIComponent(user.email ?? "")}`));
  }

  const devSlot = await getDevSlot();

  return (
    <div className="min-h-svh">
      <CoachSidebar />
      <div className="dashboard-bg min-h-svh lg:pl-[252px]">
        <TopBar email={user.email ?? ""} fullName={profile?.full_name ?? null} devSlot={devSlot} />
        {children}
      </div>
    </div>
  );
}
