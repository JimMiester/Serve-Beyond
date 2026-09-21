# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary (the simulated audience the interface is designed for):** recreational and
competitive tennis players booking private or group lessons and court time. The
design case is a player on a phone, often courtside, deciding in the minutes
between sets — not someone at a desk with time to browse.

**Actual (who will really look at this build):** people evaluating the work —
prospective clients, employers, or the author reviewing their own craft. This
audience never books anything, but it is the one that determines whether the
project succeeds.

## Product Purpose

A booking and coaching site for **Serve & Beyond Tennis Academy**, a fictional
tennis academy set in Metro Manila, Philippines.

This is a **portfolio / demonstration piece**. It does not take real bookings and
never processes money — payment was scoped out entirely (see Capabilities and
Constraints). Its purpose is to demonstrate a complete vertical slice —
marketing UI and a real database, both built to production standards.

Success is the build reading as a real, shippable product to someone who
evaluates it closely, not as a template exercise.

## Positioning

The fictional academy's stated position is indoor, all-year court time with
certified coaching and per-session progress tracking — "rain has never cancelled
a session here," which carries real weight in a monsoon climate.

That position is **invented for the demonstration**. No claim in it is backed by
evidence and none of it should be presented as fact about a real business.

The artifact's own position is the completeness of the slice: a booking product
where the marketing surface and the scheduling model — real schema, real
auth, real availability, row-level security proven against live requests —
are built rather than mocked, even though payment itself was deliberately
left out.

## Operating Context

- **Market:** Philippines. Metro Manila. Prices in Philippine pesos (₱), set at
  plausible local rates rather than converted from another currency.
- **Usage scene:** phone, outdoors, bright light, possibly on mobile data,
  deciding quickly. Mobile-first is a requirement, not a breakpoint.
- **Build sequence, set by the user:** UI first, then database. A payments
  phase (originally Stripe, later reconsidered as PayMongo mid-brainstorm) was
  dropped entirely once both were on the table — the user decided a portfolio
  project doesn't need real money moving through it. Nothing here anticipates
  payment being added later; if it ever is, that is new scope, not a resumed phase.

## Capabilities and Constraints

**Stack, pinned by the user at the outset:** Next.js (App Router), Tailwind CSS,
Supabase (Postgres, Auth, Storage), react-big-calendar, deployed on Vercel.
Next.js, Tailwind, and Supabase are installed and live; `react-big-calendar`
was never needed — the booking flow's plain server-rendered slot list covered
the same requirement with zero added dependencies. A payment processor
(Stripe, then briefly PayMongo) was pinned, reconsidered, and finally dropped
— see Operating Context.

**Confirmed product facts:**

- **Venues — one now, modelled for more.** The academy operates a single facility
  today. The data model carries a venue from day one; the UI hides venue choice
  while there is only one, so a second site costs no migration.
- **No payment, anywhere, ever.** A session is confirmed the instant a player
  picks an open slot — no charge, no payment processor, no invented price
  moment beyond the display prices already on the homepage. This was an
  explicit, considered decision (not an oversight): a payments phase was
  designed in detail — first against Stripe, then against PayMongo, complete
  with a reviewed architecture for webhook-driven confirmation — and the user
  chose to drop it rather than build it, because a portfolio piece has no
  need for real money to move. Do not reintroduce a payment step without the
  user asking for it by name.
- **Cancellation terms** currently stated on the site (free to 12 hours, charged
  in full inside 12 hours) are invented and carry no legal weight.

**Adopted engineering constraints** (applied throughout; future work should
preserve them):

- Server-rendered by default. Client JavaScript is added only where a native
  platform feature cannot do the job.
- All page copy, prices, people and image paths live in a single content module,
  `src/content/site.ts`, so the demo's invented content can be replaced in one
  place.

**Open decisions — record, do not invent:**

- Who administers bookings: coaches managing their own availability, a single
  front desk, or both. Unanswered. It determines the auth roles in the database
  phase.
- ~~Whether membership is a Stripe subscription or a manually managed status~~
  — resolved by the decision above: membership stays a manually managed
  status permanently. No subscription billing of any kind is in scope.

## Brand Commitments

- **Name:** Serve & Beyond Tennis Academy.
- **Logo:** supplied by the user and real — the only authentic asset in the
  project. `public/logo.png` (full colour) and `public/logo-light.png` (the
  charcoal sub-lockup recoloured for dark surfaces). Both are trimmed derivatives
  of the user's original file.
- **Voice, in the user's words:** "energetic and approachable, not corporate."
- **Binding visual constraint, volunteered by the user:** every accent colour is
  pulled from the supplied logo.

## Evidence on Hand

**Real:** the logo artwork. That is all.

**Invented — must never be presented as fact, cited as proof, or carried into a
real deployment:**

- all coach names, credentials and years of experience
- all prices, package contents and membership terms
- the address, phone number and email
- both testimonials and every attributed name
- all facility statistics (court count, coach count, member count, years)

**Absent, and not to be fabricated:** photography. There is none. Image slots in
the programme and coach sections are deliberately empty, rendering skeleton
placeholders, and image paths are blank strings in the content module awaiting
real files. Earlier generated illustrations were rejected by the user and
removed; do not regenerate stand-in artwork without being asked.

## Product Principles

1. **The courtside phone is the design case.** Desktop is the secondary view.
   Decisions that trade mobile legibility for desktop elegance are wrong here.
2. **Invented content stays visibly provisional.** Placeholder facts are
   scaffolding for a demo, never dressed up as evidence. Absences are stated, not
   filled.
3. **Client JavaScript earns its place.** Native platform behaviour first, CSS
   second, a bundle last — because the audience is on mobile data.
4. **One seam between demo and reality.** Content lives in one module so the
   fictional academy could be swapped for a real one without touching a component.
5. **Model the second venue while shipping the first.** Structure for the growth
   that was actually stated; do not speculate past it.

## Accessibility & Inclusion

No externally mandated standard was set. The project has adopted, and should
continue to hold, a working floor:

- **WCAG AA contrast**, enforced against the brand palette. The logo's emerald
  `#00A878` fails against white at 3.05:1, so text-bearing surfaces use a stepped
  `#008159` at 4.9:1 while the logo emerald is reserved for accents and tints.
- Visible focus states on every interactive element, and a skip link past the
  navigation.
- `prefers-reduced-motion` honoured by all motion, with no content left invisible
  when animation is disabled.
- Bright-daylight legibility treated as an accessibility concern, not a
  preference, given the usage scene.
