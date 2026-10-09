import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient, getAuthUser } from "@/lib/supabase/server";
import { getDevSlot, slotPath } from "@/lib/dev-slot";
import Sidebar from "@/components/dashboard/Sidebar";
import TopBar from "@/components/dashboard/TopBar";
import AccountMismatchNotice from "@/components/AccountMismatchNotice";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const user = await getAuthUser();

  if (!user) {
    const pathname = (await headers()).get("x-pathname") ?? "/dashboard";
    redirect(await slotPath(`/sign-in?next=${encodeURIComponent(pathname)}`));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, intended_role")
    .eq("id", user.id)
    .maybeSingle();

  // Admin and coach accounts each have their own dashboard and never fall
  // through to the player one, even if reached directly (e.g. a session
  // left over from another sign-in tab navigating straight to /dashboard,
  // or a different account signing in on another tab of this browser —
  // the session cookie is shared browser-wide, not per tab).
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
  if (profile?.intended_role === "coach") {
    return (
      <AccountMismatchNotice
        email={user.email ?? ""}
        roleLabel="Coach"
        continueHref={await slotPath("/coach")}
        continueLabel="Continue to Coach Dashboard"
      />
    );
  }

  const devSlot = await getDevSlot();

  return (
    <div className="min-h-svh">
      <Sidebar />
      <div className="dashboard-bg min-h-svh lg:pl-[252px]">
        <TopBar email={user.email ?? ""} fullName={profile?.full_name ?? null} devSlot={devSlot} />
        {children}
      </div>
    </div>
  );
}
