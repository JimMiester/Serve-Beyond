import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav session={user ? { email: user.email ?? "" } : null} />
      {children}
      <Footer />
    </>
  );
}
