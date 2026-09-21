import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/content/site";
import type { Court } from "@/lib/supabase/types";

export default async function CourtsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("courts").select("*").eq("active", true).order("name");
  if (error) throw error;
  const courts = (data ?? []) as Court[];

  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="The facility"
          title="Eight courts, one roof."
          lede="Indoor, floodlit, climate controlled. Rain has never cancelled a session here."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {courts.map((c) => (
            <li key={c.id}>
              <Card className="p-6 text-center">
                <p className="font-display text-[22px] text-navy">{c.name}</p>
              </Card>
            </li>
          ))}
        </ul>

        <section className="mt-14">
          <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">Opening hours</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            {site.hours.map((h) => (
              <Card key={h.days} className="p-5">
                <dt className="text-[13px] text-navy/60">{h.days}</dt>
                <dd className="mt-1 text-[15px] font-semibold text-navy">{h.time}</dd>
              </Card>
            ))}
          </dl>
        </section>

        <Button href="/book" className="mt-10">
          Book a court
        </Button>
      </main>
    </PageTransition>
  );
}
