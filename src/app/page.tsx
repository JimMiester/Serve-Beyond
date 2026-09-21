import Nav from "@/components/Nav";
import Hero, { BookingBar } from "@/components/Hero";
import Programs from "@/components/sections/Programs";
import HowItWorks from "@/components/sections/HowItWorks";
import Coaches from "@/components/sections/Coaches";
import Pricing from "@/components/sections/Pricing";
import Proof from "@/components/sections/Proof";
import Faq from "@/components/sections/Faq";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav session={user ? { email: user.email ?? "" } : null} />
      <main id="main">
        <Hero />
        <BookingBar />
        {/* Bands alternate cream / navy so the scroll has rhythm. */}
        <Programs />
        <HowItWorks />
        <Coaches />
        <Pricing />
        <Proof />
        <Faq />
      </main>
      <Footer />
    </>
  );
}
