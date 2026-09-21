import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { pricing } from "@/content/site";

export default function MembershipPage() {
  const membership = pricing.find((p) => p.tier === "Membership");
  if (!membership) throw new Error("Membership tier missing from pricing content");

  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[700px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Membership"
          title="For players who are here every week."
          lede="No joining fee, no contract. If a membership wouldn't actually save you money at how often you play, we'll tell you — not sign you up anyway."
        />

        <Card variant="featured" className="mt-10 p-8 sm:p-10">
          <p className="flex items-baseline gap-2">
            <span className="font-display text-[52px] leading-none text-white">{membership.price}</span>
            <span className="text-[15px] text-cream/60">{membership.unit}</span>
          </p>
          <p className="mt-3 text-[15px] text-cream/70">{membership.note}</p>

          <ul className="mt-8 space-y-3 border-t border-white/15 pt-8">
            {membership.features.map((f) => (
              <li key={f} className="flex gap-3 text-[15px] leading-[1.5]">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 17 17"
                  aria-hidden="true"
                  fill="none"
                  stroke="#5bc0eb"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mt-0.5 shrink-0"
                >
                  <path d="m3.5 9 3.5 3.5 6.5-8" />
                </svg>
                <span className="text-cream/85">{f}</span>
              </li>
            ))}
          </ul>

          <Button href="/sign-up" className="mt-8 w-full">
            {membership.cta}
          </Button>
        </Card>
      </main>
    </PageTransition>
  );
}
