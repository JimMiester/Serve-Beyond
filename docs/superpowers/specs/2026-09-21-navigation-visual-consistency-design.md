# Navigation & Visual Consistency — Design

Status: approved by user, pending implementation plan.

## Context

The site has one real page (the homepage) and four working app routes (`/book`,
`/account`, `/sign-in`, `/sign-up`). Its nav bar (`Nav.tsx`) links to five more
routes — Courts, Coaching, Membership, Results, FAQs — that have 404ed since
Phase 1. Every existing page hand-renders its own `<Nav>` and, where
applicable, its own `<Footer>`, so despite looking identical they unmount and
remount on every navigation; there is no shared layout doing this once.

This phase closes both gaps together: it builds the five missing pages and,
in the same pass, fixes the structural reason header/footer weren't actually
persistent, then adds page-transition motion on top of a foundation that
finally supports it correctly.

## Decisions this design is built on

Three decisions were made with the user before this was written, each
correcting a mismatch between the original request and what the codebase
actually contains:

1. **The booking page keeps its existing slot-list UI, restyled only.**
   `react-big-calendar` was never installed (confirmed in `package.json`);
   the booking flow is a plain server-rendered list of time-slot buttons,
   proven end-to-end in Phase 2 (build, lint, and a live two-account RLS
   check). This phase applies the formalized design tokens to that existing
   UI. It does not touch `availability.ts`, `book/actions.ts`, or any booking
   logic, and it does not add a calendar-grid dependency.
2. **`/coaching` is a bio directory, not a scheduling surface.** Phase 2
   deliberately closed "per-coach availability" as out of scope ("admin
   assigns a coach after booking"). This page is the homepage's coach
   directory given its own URL and room, reading the same `coaches` table.
   No new data model.
3. **The five pages built are the nav's own five links** — Courts, Coaching,
   Membership, Results, FAQs — not the differently-named pricing/about/contact
   pages the original request listed. The nav already points at these five
   URLs; building them closes a gap that has existed since Phase 1 rather
   than adding a second, unlinked set of pages.

## Architecture

### Route groups replace per-page chrome

```
src/app/
  (site)/
    layout.tsx          fetches the session once, renders <Nav session={...}>
                         and <Footer>, wraps every route below in one
                         persistent tree
    page.tsx             (homepage — moves in, drops its own Nav/Footer)
    courts/page.tsx       NEW
    coaching/page.tsx     NEW
    membership/page.tsx   NEW
    results/page.tsx      NEW
    faqs/page.tsx          NEW
    book/page.tsx         (moves in, drops its own Nav/Footer call)
    account/page.tsx      (moves in, drops its own Nav/Footer call)
  (auth)/
    sign-in/page.tsx      (unchanged — Phase 2's deliberate no-chrome choice)
    sign-up/page.tsx      (unchanged)
```

Route groups (the parenthesized folders) are a Next.js App Router convention
that groups routes under a shared layout **without adding a URL segment** —
`(site)/courts/page.tsx` still serves at `/courts`, not `/site/courts`. This
is the framework's own mechanism for "most routes share chrome, a few
don't," not a workaround; sign-in/sign-up keep their existing bare-page
design entirely unchanged by living in a sibling group with no shared layout
of its own.

Each page under `(site)` currently calls `createClient()` and fetches the
session itself only to hand it to `<Nav>`. That fetch moves to
`(site)/layout.tsx` and happens exactly once per navigation instead of once
per page — a real (if small) reduction in duplicated Supabase calls, not
just a code-organization tidy-up.

### Design tokens: extend, don't duplicate

This project is Tailwind v4, which has no `tailwind.config.js` — the
`@theme` block already in `globals.css` (`--color-emerald`, `--color-sky`,
`--color-gold`, `--color-navy`, `--color-cream`, plus the two font
variables) **is** the tokens file the request asks for. This phase extends
it with the two things actually missing:

- A named **radius scale** (`--radius-card: 1rem` matching the `rounded-2xl`
  already used everywhere by convention, so "the card radius" has one named
  source instead of being a repeated magic class).
- A **type-scale comment block** documenting the sizes already in use
  (eyebrow 12px/13px, body 15px/16px, heading `clamp()` ranges) so a new
  page's author copies a documented scale instead of inventing a new size.

No new token *values* — every color, weight, and size already in use across
the homepage stays exactly as it is. This section makes the existing system
explicit and complete, not different.

### The `Card` primitive

Programs, Coaches, and Pricing each currently hand-roll the same shape
(`rounded-2xl border border-navy/10`, consistent but copy-pasted three
times). Five new pages need the same look. Three existing call sites plus
five new ones is exactly the point Phase 1 used to justify extracting
`Button` — this phase extracts `Card` the same way: one component, a
handful of props for the variations already in use (bordered vs. filled,
the "featured/dark" treatment `Pricing.tsx`'s middle tier already has), no
speculative options beyond what an existing section already needs.

### Page transitions: React's `<ViewTransition>`, zero new dependencies

Confirmed directly in this project's installed Next version's own bundled
docs (`node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`):
`<ViewTransition>` ships with the App Router's React canary release — no
package installed, works today. This resolves the request's own fallback
clause ("View Transitions API if the Next.js version supports it well;
otherwise Framer Motion") decisively in favor of the first branch, and
keeps faith with this project's standing principle that a native platform
feature is preferred over a client-side animation library.

What's built:

- A fade + ~10px slide on every route change inside the `(site)` group,
  timed at 220ms with an ease-in-out curve — inside the 200-300ms range
  requested.
- A **Suspense-driven loading reveal**: any page that fetches data (all
  five new pages, plus the existing Programs/Coaches sections) wraps its
  data-dependent content in `<Suspense>` with the existing `Skeleton`
  component as the fallback, and pairs the fallback/content swap with
  `<ViewTransition>`'s documented enter/exit pattern — this is the "skeleton
  instead of blank flash" requirement, built on a component that already
  exists rather than a new one.
- `prefers-reduced-motion` handled by zeroing the view-transition
  animation's duration in CSS, the same pattern already used for `.enter-up`
  and the stagger-children reveals from earlier phases — one more rule in
  the same existing media-query block, not a new mechanism.

**What is deliberately not built:** the docs' full directional forward/back
slide pattern (`transitionTypes`, `nav-forward`/`nav-back`). That pattern
needs a "which links are forward vs. back" hierarchy to encode, and a flat
five-item marketing nav (Courts/Coaching/Membership/Results/FAQs, no parent-
child relationship between them) has no such hierarchy to express correctly.
A plain crossfade+slide on every navigation, with no direction, is the
honest fit for this nav's actual shape. Adding direction later is additive
work on top of this, not a rebuild of it.

**Where the transition wrapper lives:** per the docs' own guidance,
`<ViewTransition>` must wrap each page's content in that page's `page.tsx`,
not in the shared layout — "layouts persist across navigations, so enter
and exit never fire there." `(site)/layout.tsx` stays a plain wrapper
around `{children}`; the transition markup is a small shared helper
component each page's content is wrapped in, not layout-level magic.

**Anchoring the header:** the View Transition API takes a DOM snapshot of
the whole viewport by default, which can make a pixel-identical header
appear to flash even though it never actually unmounts. The docs' fix — a
named `viewTransitionName` on the header plus a CSS rule suppressing its
own animation — is applied to `Nav`'s root element so it visibly stays
still while page content transitions underneath it.

### The five pages

All five read from data that already exists; none invents new content or a
new table.

| Page | Source | Shape |
|---|---|---|
| `/courts` | `courts` table (3 seeded rows) + `site.hours` | Facility description, the court list, opening hours, CTA into `/book` |
| `/coaching` | `coaches` table | Full-page version of the homepage's coach directory — same cards, same data, its own room instead of a homepage strip |
| `/membership` | `pricing` array's `"Membership"` tier | That tier's price and feature list, expanded with supporting copy, CTA to `/sign-up` |
| `/results` | `stats` + `testimonials` arrays | The homepage's proof content, given a full page instead of a homepage band |
| `/faqs` | `faqs` array | The same 5 Q&As, same native `<details>` accordion pattern already built for the homepage |

Each page gets its own layout suited to its content — a directory grid for
Coaching, a single detailed offer for Membership, a stat-and-quote layout
for Results — built from the shared tokens and the new `Card`/`Button`/
`SectionHead` primitives, not copies of the homepage's section markup. This
mirrors the original request's own instruction: same visual language, not
the same layout.

## Error handling

- Every new page's Supabase read follows the pattern the Phase 2 final
  review established project-wide: destructure `{ data, error }` and
  `throw error` rather than silently rendering an empty state on a real
  query failure.
- A `<Suspense>` boundary's fallback is the `Skeleton` component, which
  already renders correctly with zero JavaScript if a bundle fails to load
  (an existing, verified property from Phase 1) — the loading-state addition
  in this phase doesn't weaken that guarantee.
- View transitions degrade to an instant, unanimated swap in any browser
  without View Transition API support (Safari/Firefox versions predating
  it) — the docs state this explicitly: "without browser support, your
  application works normally; the transitions do not animate." No fallback
  code is needed for this case, only for `prefers-reduced-motion`, which is
  handled explicitly (see above).

## Testing

No JS test framework exists in this project (a standing decision from
Phase 2, not reopened here). Verification is:

- `npm run build` + `npx eslint src --max-warnings=0`, clean, as every prior
  phase.
- A manual pass confirming: the header visibly does not remount (no flash,
  no flicker of the frosted-glass scroll state) when navigating between any
  two of the eight routes under `(site)` (home, the five new pages, `/book`,
  `/account`); each of the five new pages renders its real seeded/content
  data; `prefers-reduced-motion` produces an instant, non-animated
  navigation when enabled in the browser/OS.

## Open items carried forward, not decided here

- Whether directional (forward/back) transitions are ever added once the
  nav's five links gain enough hierarchy (e.g. sub-pages under Coaching) to
  make "forward" and "back" a meaningful distinction.
- Real photography for the Courts and Coaching pages — both still render
  the `Skeleton` placeholder for any image slot, exactly as the homepage
  does, per the standing "do not fabricate stand-in imagery" rule from
  `PRODUCT.md`.
