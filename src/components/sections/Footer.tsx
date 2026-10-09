import { Link } from "next-view-transitions";
import Logo from "@/components/Logo";
import Button from "@/components/ui/Button";
import { site } from "@/content/site";

const COLUMNS = [
  {
    title: "Play",
    links: [
      { label: "Court hire", href: "/courts" },
      { label: "Private coaching", href: "/coaching/private" },
      { label: "Group clinics", href: "/coaching/group" },
      { label: "Junior academy", href: "/coaching/junior" },
    ],
  },
  {
    title: "Club",
    links: [
      { label: "Our coaches", href: "/coaching" },
      { label: "Results", href: "/results" },
      { label: "FAQs", href: "/faqs" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms", href: "/terms" },
      { label: "Privacy", href: "/privacy" },
      { label: "Cancellations", href: "/terms#cancellations" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="pt-20 text-white sm:pt-28">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-8 border-b border-white/10 pb-14">
          <h2 className="max-w-xl font-display text-[clamp(1.9rem,4vw,2.75rem)] leading-[1.1]">
            The court is free at 7. Are you?
          </h2>
          <Button href="/book" className="shrink-0">
            Book a Session
          </Button>
        </div>

        <div className="grid gap-12 py-14 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Logo className="h-11 w-auto" />
            <address className="mt-6 not-italic text-[15px] leading-[1.7] text-white/60">
              {site.address.map((l) => (
                <span key={l} className="block">
                  {l}
                </span>
              ))}
            </address>
            <div className="mt-5 flex flex-col gap-1 text-[15px]">
              <a href={`tel:${site.phone.replace(/\s/g, "")}`} className="text-white hover:text-emerald">
                {site.phone}
              </a>
              <a href={`mailto:${site.email}`} className="text-white hover:text-emerald">
                {site.email}
              </a>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} className="lg:col-span-2" aria-label={col.title}>
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-sky">{col.title}</h3>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="text-[15px] text-white/60 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}

          <div className="lg:col-span-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-sky">Opening hours</h3>
            <dl className="mt-5 space-y-3 text-[15px]">
              {site.hours.map((h) => (
                <div key={h.days}>
                  <dt className="text-white/55">{h.days}</dt>
                  <dd className="text-white">{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-8 text-[14px] text-white/45">
          <p>
            © {new Date().getFullYear()} {site.name}
          </p>
          <p>{site.region}</p>
        </div>
      </div>
    </footer>
  );
}
