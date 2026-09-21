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
will not process real money. Its purpose is to demonstrate a complete vertical
slice — marketing UI, database, and payments — built to production standards.

Success is the build reading as a real, shippable product to someone who
evaluates it closely, not as a template exercise.

## Positioning

The fictional academy's stated position is indoor, all-year court time with
certified coaching and per-session progress tracking — "rain has never cancelled
a session here," which carries real weight in a monsoon climate.

That position is **invented for the demonstration**. No claim in it is backed by
evidence and none of it should be presented as fact about a real business.

The artifact's own position is the completeness of the slice: a booking product
where the marketing surface, the scheduling model, and the payment path are all
built rather than mocked.

## Operating Context

- **Market:** Philippines. Metro Manila. Prices in Philippine pesos (₱), set at
  plausible local rates rather than converted from another currency.
- **Usage scene:** phone, outdoors, bright light, possibly on mobile data,
  deciding quickly. Mobile-first is a requirement, not a breakpoint.
- **Build sequence, set by the user:** UI first, then database, then payments.
  One phase at a time; later phases are not to be anticipated in code.

## Capabilities and Constraints

**Stack, pinned by the user at the outset:** Next.js (App Router), Tailwind CSS,
Supabase (Postgres, Auth, Storage), Stripe, react-big-calendar, deployed on
Vercel. Next.js and Tailwind are installed; the rest are not yet.

**Confirmed product facts:**

- **Venues — one now, modelled for more.** The academy operates a single facility
  today. The data model carries a venue from day one; the UI hides venue choice
  while there is only one, so a second site costs no migration.
- **Payment — in full, online, at the time of booking.** A session is confirmed
  when it is paid. Stripe runs in **test mode only** and must never be given live
  keys in this project.
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
- Whether membership is a Stripe subscription or a manually managed status.

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
