import PageTransition from "@/components/ui/PageTransition";
import { GlassCard, AccentButton } from "@/components/dashboard/glass";
import { IconHelp } from "@/components/dashboard/icons";

export default function HelpPage() {
  return (
    <PageTransition>
      <main id="main" tabIndex={-1} className="mx-auto max-w-[1000px] px-5 pb-20 pt-8 sm:px-8">
        <h1 className="font-display text-[clamp(1.75rem,3.4vw,2.5rem)] text-white">Help</h1>
        <p className="mt-1 text-[15px] text-white/60">Support resources for your account.</p>

        <GlassCard className="mt-8 flex flex-col items-center gap-4 py-14 text-center" delay={0}>
          <span
            className="flex size-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
          >
            <IconHelp width={24} height={24} />
          </span>
          <h2 className="font-display text-[20px] font-bold text-white">This page is on its way</h2>
          <p className="max-w-sm text-[15px] text-white/60">FAQs and support contact options will live here.</p>
          <AccentButton href="/dashboard">Back to Dashboard</AccentButton>
        </GlassCard>
      </main>
    </PageTransition>
  );
}
