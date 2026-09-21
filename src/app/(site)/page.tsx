import Hero, { BookingBar } from "@/components/Hero";
import Programs from "@/components/sections/Programs";
import HowItWorks from "@/components/sections/HowItWorks";
import Coaches from "@/components/sections/Coaches";
import Pricing from "@/components/sections/Pricing";
import Proof from "@/components/sections/Proof";
import Faq from "@/components/sections/Faq";

export default function Home() {
  return (
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
  );
}
