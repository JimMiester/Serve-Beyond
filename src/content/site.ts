/**
 * All homepage copy, prices and imagery live here.
 *
 * PLACEHOLDER CONTENT — invented, not real. Swap the values, not the components.
 * Image slots are intentionally blank. Drop a file in /public and set the path
 * here — the components render an empty plate until then.
 */

export const site = {
  name: "Serve & Beyond Tennis Academy",
  phone: "+63 2 8541 0188",
  email: "hello@serveandbeyond.ph",
  address: ["Ortigas Indoor Tennis Centre", "128 Julia Vargas Avenue", "Pasig City 1605, Metro Manila"],
  region: "Metro Manila, Philippines",
  // dow/openHour/closeHour are the single source of truth the booking engine
  // reads (src/app/(site)/book/availability.ts) — days/time are just how
  // this same data displays on /courts. Keeping both on one row means they
  // can't drift the way they used to (slots used to offer hours up to 22:00
  // on a Sunday the facility actually closes at 18:00).
  hours: [
    { days: "Mon – Fri", time: "06:00 – 22:00", dow: [1, 2, 3, 4, 5], openHour: 6, closeHour: 22 },
    { days: "Saturday", time: "07:00 – 20:00", dow: [6], openHour: 7, closeHour: 20 },
    { days: "Sunday", time: "08:00 – 18:00", dow: [0], openHour: 8, closeHour: 18 },
  ],
};

export const steps = [
  {
    n: "01",
    title: "Pick your slot",
    body: "Choose a court, a coach and a time that fits. Availability is live, so what you see is what is free.",
  },
  {
    n: "02",
    title: "Turn up and play",
    body: "Rackets and balls are provided. Courts are lit and swept ten minutes before you are due on.",
  },
  {
    n: "03",
    title: "Track the gains",
    body: "Session notes, video clips and progress markers land in your player log before you reach the car park.",
  },
];

export const pricing = [
  {
    tier: "Court Hire",
    price: "₱600",
    unit: "per hour",
    note: "Just the court, whenever you want it.",
    features: [
      "Indoor, floodlit, all year",
      "Rackets and balls included",
      "Book up to 14 days ahead",
      "Free cancellation to 12 hours",
    ],
    cta: "Book a court",
    featured: false,
  },
  {
    tier: "Private Lesson",
    price: "₱1,500",
    unit: "per hour",
    note: "One coach, one player, no hiding.",
    features: [
      "Certified coach, one-to-one",
      "Video review every third session",
      "Written session notes each visit",
      "Second court held for drills",
    ],
    cta: "Book a lesson",
    featured: true,
  },
];

export const stats = [
  { value: "8", label: "Indoor courts" },
  { value: "14", label: "Certified coaches" },
  { value: "600+", label: "Active members" },
  { value: "12", label: "Years coaching" },
];

export const testimonials = [
  {
    quote:
      "I had plateaued for three years. Six weeks with Marcus and my second serve is finally a weapon instead of an apology.",
    name: "Tom Bassett",
    detail: "Club standard, member since 2022",
  },
  {
    quote:
      "My daughter went from red ball to county trials in eighteen months. The junior pathway here is the real thing, not a holiday camp.",
    name: "Ayesha Kheraj",
    detail: "Parent, Junior Academy",
  },
];

export const faqs = [
  {
    q: "Do I need my own racket?",
    a: "No. Rackets and balls are included with every court booking and lesson. If you would rather use your own, there is stringing on site with a 24-hour turnaround.",
  },
  {
    q: "How far ahead can I book?",
    a: "Up to three months ahead for any court, class, or lesson — pick a date on the booking page and open slots show up right away.",
  },
  {
    q: "What is the cancellation policy?",
    a: "Cancel any time from your dashboard, free of charge. There's no deposit or prepayment taken when you book, so there's nothing to refund.",
  },
  {
    q: "Do you coach complete beginners?",
    a: "Yes, and a good share of our adult members had never held a racket before joining. Start with a private lesson or the Tuesday beginners clinic.",
  },
  {
    q: "Are the courts actually indoors?",
    a: "All eight, under one roof, floodlit and climate controlled. Rain has never cancelled a session here.",
  },
];
