import { redirect } from "next/navigation";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getDevSlot, slotPath } from "@/lib/dev-slot";
import AdminSidebar from "@/components/dashboard/AdminSidebar";
import TopBar from "@/components/dashboard/TopBar";
import AccountMismatchNotice from "@/components/AccountMismatchNotice";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    redirect(await slotPath("/admin-login"));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, intended_role")
    .eq("id", user.id)
    .maybeSingle();

  // A signed-out visitor gets sent to /admin-login above; reaching here
  // with a real account that isn't admin means a different account is
  // now the active session in this browser (e.g. another tab signed in
  // as admin, or vice versa — the session cookie is shared browser-wide).
  if (profile?.role !== "admin") {
    const isCoach = profile?.intended_role === "coach";
    return (
      <AccountMismatchNotice
        email={user.email ?? ""}
        roleLabel={isCoach ? "Coach" : "Player"}
        continueHref={await slotPath(isCoach ? "/coach" : "/dashboard")}
        continueLabel={isCoach ? "Continue to Coach Dashboard" : "Continue to Dashboard"}
      />
    );
  }

  const devSlot = await getDevSlot();

  return (
    <div className="min-h-svh">
      <AdminSidebar />
      <div className="dashboard-bg min-h-svh lg:pl-[252px]">
        <TopBar email={user.email ?? ""} fullName={profile?.full_name ?? null} devSlot={devSlot} />
        {children}
      </div>
    </div>
  );
}
