import Hero, { BookingBar } from "@/components/Hero";
import Programs from "@/components/sections/Programs";
import HowItWorks from "@/components/sections/HowItWorks";
import Coaches from "@/components/sections/Coaches";
import Pricing from "@/components/sections/Pricing";
import Proof from "@/components/sections/Proof";
import Faq from "@/components/sections/Faq";
import PageTransition from "@/components/ui/PageTransition";

export default function Home() {
  return (
    <PageTransition>
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
    </PageTransition>
  );
}
