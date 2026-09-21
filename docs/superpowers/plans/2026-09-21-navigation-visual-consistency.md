# Navigation & Visual Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the site persistent header/footer across navigation, native page transitions, five real pages closing the nav's existing 404s, and a formalized shared token/component system every page draws from.

**Architecture:** Route groups (`(site)` / `(auth)`) replace per-page `<Nav>`/`<Footer>` calls with one shared layout, fixing the actual reason chrome wasn't persistent. `next-view-transitions` (a ~13KB, zero-dependency wrapper around the native browser View Transition API — not an animation engine) drives route transitions, since React's own `<ViewTransition>` component needs a canary React build this project deliberately doesn't run. A new `Card` primitive extracts the repeated card markup already duplicated three times, serving both the refactored existing sections and five new pages.

**Tech Stack:** Next.js 16 App Router (existing), Tailwind CSS v4 (existing, CSS-native theming via `@theme`), `next-view-transitions` (new, zero transitive dependencies), Supabase (existing, read-only queries for the new pages).

**Spec:** `docs/superpowers/specs/2026-09-21-navigation-visual-consistency-design.md`

## Global Constraints

- **No Framer Motion, no React `ViewTransition` component.** The latter needs React's canary channel; this project pins exact stable versions everywhere (`react: 19.2.8`) and that discipline is not reopened here. `next-view-transitions` wraps the native `document.startViewTransition()` browser API — the animation itself is hand-written CSS, not a bundled motion engine.
- **Server-rendered by default.** None of the five new pages need `"use client"`. The only new client component is `PageTransition.tsx`, and only because `next-view-transitions`'s own primitives require it.
- **No new Supabase tables, no new content invented.** Every new page reads `courts`/`coaches` (Supabase) or `site.ts`'s existing `pricing`/`stats`/`testimonials`/`faqs` exports.
- **The booking page (`/book`) keeps its exact existing logic** — `availability.ts` and `actions.ts` move without a single line changed. Only its JSX gets restyled with the new `Card`/token system.
- **Money is peso, `.toLocaleString()` for thousands separators** — the existing convention from Phase 2, unchanged.
- **`prefers-reduced-motion` produces an instant, non-animated result** for every new animation in this phase, following the exact pattern already in `globals.css`'s existing reduced-motion block (zero out `animation-duration`/`transition-duration`, never leave content invisible).

---

## File Structure

```
package.json                              MODIFY — add next-view-transitions
src/app/layout.tsx                        MODIFY — wrap <html> in <ViewTransitions>
src/app/globals.css                       MODIFY — radius token, type-scale doc,
                                                    view-transition CSS, reduced-motion additions
src/app/(site)/
  layout.tsx                              NEW — session fetch (once), Nav + {children} + Footer
  page.tsx                                MOVED from src/app/page.tsx
  courts/page.tsx                         NEW
  coaching/page.tsx                       NEW
  membership/page.tsx                     NEW
  results/page.tsx                        NEW
  faqs/page.tsx                           NEW
  book/page.tsx                           MOVED, restyled
  book/actions.ts                         MOVED, unchanged
  book/availability.ts                    MOVED, unchanged
  account/page.tsx                        MOVED
  account/actions.ts                      MOVED, unchanged
src/app/(auth)/
  sign-in/page.tsx                        MOVED, unchanged
  sign-up/page.tsx                        MOVED, unchanged

src/components/
  Nav.tsx                                 MODIFY — Link import swap, header anchoring style
  ui/
    Card.tsx                              NEW
    PageTransition.tsx                    NEW
    Button.tsx                            MODIFY — Link import swap only
  sections/
    Footer.tsx                            MODIFY — Link import swap only
    Hero.tsx                              MODIFY — Link import swap only
    Programs.tsx                          MODIFY — Link import swap + Card refactor
    Coaches.tsx                           MODIFY — Card refactor
    Pricing.tsx                           MODIFY — Card refactor
```

---

### Task 1: Design tokens and the `Card` primitive

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/Card.tsx`

**Interfaces:**
- Produces: `Card` component — `variant?: "default" | "featured"`, `className?: string`, `children: ReactNode`. Every later task that renders a card (Tasks 5-10) imports this exact name and prop shape.

- [ ] **Step 1: Add the radius token and type-scale documentation to globals.css**

In `src/app/globals.css`, inside the existing `@theme inline { ... }` block (do not create a second block), add one line after the existing color tokens:

```css
  --color-navy: #0f2430;
  --color-cream: #f7f5f1;

  /* Every card on the site uses this radius by convention (rounded-2xl).
     Named here so a new page copies one documented value instead of
     re-typing the Tailwind class from memory. */
  --radius-card: 1rem;
```

Immediately after the closing `}` of the `@theme` block, add a comment documenting the type scale already in use (no new sizes, just written down):

```css
/* Type scale in use across the site — copy one of these, don't invent a
   new size. (Tailwind arbitrary values, e.g. text-[15px], not a Tailwind
   scale step — this project's sizes were tuned individually, not off the
   default scale.)
     Eyebrow / label:    11px, 12px, 13px  (uppercase, tracked wide)
     Body:               14px, 15px, 16px
     Lede / intro:       17px
     Card heading:       22px, 23px
     Section heading:    clamp(2rem, 4.4vw, 3rem)   — SectionHead's h2
     Page heading:       clamp(2rem, 4vw, 2.75rem)  — /book, /account today
     Hero display:       clamp(2.75rem, 7.2vw, 4rem) */
```

- [ ] **Step 2: Write the Card component**

Create `src/components/ui/Card.tsx`:

```tsx
/**
 * The card shape already repeated three times (Programs, Coaches, Pricing)
 * before this extraction, plus five new pages that need the same look —
 * the same threshold that justified extracting Button in Phase 1.
 *
 * `featured` is the one real visual variant in use today: Pricing's middle
 * tier (navy fill, white text, raised). Everything else is the default:
 * a bordered cream/white card. No other variant exists yet — don't invent
 * one ahead of a page that actually needs it.
 */
export default function Card({
  variant = "default",
  className = "",
  children,
}: {
  variant?: "default" | "featured";
  className?: string;
  children: React.ReactNode;
}) {
  const base =
    variant === "featured"
      ? "rounded-[var(--radius-card)] bg-navy text-white shadow-[0_24px_60px_-24px_rgba(15,36,48,0.55)]"
      : "rounded-[var(--radius-card)] border border-navy/10 bg-cream";

  return <div className={`${base} ${className}`}>{children}</div>;
}
```

- [ ] **Step 3: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean. `Card` isn't imported anywhere yet, so this only proves it's syntactically and type-correct in isolation — Tasks 5-10 prove it's used correctly.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css src/components/ui/Card.tsx
git commit -m "feat(ui): design token additions and the Card primitive"
```

---

### Task 2: Route groups — persistent header/footer

**Files:**
- Create: `src/app/(site)/layout.tsx`
- Move: `src/app/page.tsx` → `src/app/(site)/page.tsx`
- Move: `src/app/book/page.tsx` → `src/app/(site)/book/page.tsx`
- Move: `src/app/book/actions.ts` → `src/app/(site)/book/actions.ts`
- Move: `src/app/book/availability.ts` → `src/app/(site)/book/availability.ts`
- Move: `src/app/account/page.tsx` → `src/app/(site)/account/page.tsx`
- Move: `src/app/account/actions.ts` → `src/app/(site)/account/actions.ts`
- Move: `src/app/sign-in/page.tsx` → `src/app/(auth)/sign-in/page.tsx`
- Move: `src/app/sign-up/page.tsx` → `src/app/(auth)/sign-up/page.tsx`

**Interfaces:**
- Consumes: `createClient()` from `@/lib/supabase/server` (existing), `Nav`/`Footer` (existing).
- Produces: every page under `(site)` no longer renders its own `<Nav>`/`<Footer>` — the layout does it once. Tasks 5-10's new pages must NOT render `<Nav>`/`<Footer>` themselves; the layout already wraps them.

Route groups (parenthesized folder names) are a Next.js App Router convention: they group routes under a shared layout **without adding a URL segment**. `(site)/book/page.tsx` still serves at exactly `/book`, not `/site/book`.

- [ ] **Step 1: Move the files**

```bash
mkdir -p "src/app/(site)/book" "src/app/(site)/account" "src/app/(auth)/sign-in" "src/app/(auth)/sign-up"
git mv src/app/page.tsx "src/app/(site)/page.tsx"
git mv src/app/book/page.tsx "src/app/(site)/book/page.tsx"
git mv src/app/book/actions.ts "src/app/(site)/book/actions.ts"
git mv src/app/book/availability.ts "src/app/(site)/book/availability.ts"
git mv src/app/account/page.tsx "src/app/(site)/account/page.tsx"
git mv src/app/account/actions.ts "src/app/(site)/account/actions.ts"
git mv src/app/sign-in/page.tsx "src/app/(auth)/sign-in/page.tsx"
git mv src/app/sign-up/page.tsx "src/app/(auth)/sign-up/page.tsx"
rmdir src/app/book src/app/account src/app/sign-in src/app/sign-up 2>/dev/null || true
```

`git mv` preserves file history; the empty source directories are removed afterward (the `|| true` tolerates a directory that's already gone on some shells).

- [ ] **Step 2: Write the shared layout**

Create `src/app/(site)/layout.tsx`:

```tsx
import Nav from "@/components/Nav";
import Footer from "@/components/sections/Footer";
import { createClient } from "@/lib/supabase/server";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <>
      <Nav session={user ? { email: user.email ?? "" } : null} />
      {children}
      <Footer />
    </>
  );
}
```

This is the ONE place the session is now fetched for chrome purposes — every page below stops fetching it just to hand it to `Nav`.

- [ ] **Step 3: Strip Nav/Footer out of the moved pages**

In `src/app/(site)/page.tsx`, remove the `Nav` and `Footer` imports and their renders. The file becomes:

```tsx
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
```

`Home` no longer needs to be `async` and no longer imports `createClient` — the session fetch moved to the layout. Section order is unchanged from the original file: Hero, BookingBar, Programs, HowItWorks, Coaches, Pricing, Proof, Faq.

In `src/app/(site)/book/page.tsx`: remove the `Nav`/`Footer` imports and their two render sites (currently wrapping the `<main>` in a fragment `<>...</>`). The function returns just the `<main>` element directly — no fragment needed once there's only one top-level element:

```tsx
import Button from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { computeAvailableSlots } from "./availability";
import { createBooking } from "./actions";
import type { Booking, Court, Program } from "@/lib/supabase/types";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string; date?: string; program?: string; error?: string; booked?: string }>;
}) {
  const { court, date, program, error, booked } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: courtsData, error: courtsError },
    { data: programsData, error: programsError },
  ] = await Promise.all([
    supabase.from("courts").select("*").eq("active", true).order("name"),
    supabase.from("programs").select("*").order("price_from"),
  ]);
  if (courtsError) throw courtsError;
  if (programsError) throw programsError;
  const courts = (courtsData ?? []) as Court[];
  const programs = (programsData ?? []) as Program[];

  const selectedCourt = court ?? courts[0]?.id ?? "";
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  const selectedDate = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "") ? date! : today;
  const selectedProgram = program ?? programs[0]?.id ?? "";

  let slots: ReturnType<typeof computeAvailableSlots> = [];
  if (selectedCourt) {
    const dayStart = `${selectedDate}T00:00:00+08:00`;
    const dayEnd = `${selectedDate}T23:59:59+08:00`;
    const { data: existing, error: existingError } = await supabase
      .from("bookings")
      .select("starts_at, ends_at")
      .eq("court_id", selectedCourt)
      .eq("status", "confirmed")
      .gte("starts_at", dayStart)
      .lte("starts_at", dayEnd);
    if (existingError) throw existingError;

    slots = computeAvailableSlots(selectedDate, (existing ?? []) as Pick<Booking, "starts_at" | "ends_at">[]);
  }

  return (
    <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
      <h1 className="font-display text-[clamp(2rem,4vw,2.75rem)] text-navy">Book a court</h1>

      {booked && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-[15px] text-emerald-800">
          Booked. See it on your{" "}
          <a href="/account" className="font-semibold underline">
            account page
          </a>
          .
        </p>
      )}
      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[15px] text-red-700">{error}</p>}

      <form method="get" className="mt-8 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Court</span>
          <select
            name="court"
            defaultValue={selectedCourt}
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
          >
            {courts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Date</span>
          <input
            type="date"
            name="date"
            defaultValue={selectedDate}
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
          />
        </label>
        <label className="block">
          <span className="block text-[13px] font-medium text-navy/70">Programme</span>
          <select
            name="program"
            defaultValue={selectedProgram}
            className="mt-1.5 w-full rounded-xl border border-navy/15 px-4 py-3 text-[15px]"
          >
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" variant="outline" className="sm:col-span-3">
          Check availability
        </Button>
      </form>

      <h2 className="mt-10 text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">
        Available times, {selectedDate}
      </h2>

      {slots.length === 0 ? (
        <p className="mt-4 text-[15px] text-navy/60">No open slots this day. Try another date.</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {slots.map((slot) => (
            <li key={slot.startsAt}>
              <form action={createBooking}>
                <input type="hidden" name="court_id" value={selectedCourt} />
                <input type="hidden" name="program_id" value={selectedProgram} />
                <input type="hidden" name="date" value={selectedDate} />
                <input type="hidden" name="starts_at" value={slot.startsAt} />
                <input type="hidden" name="ends_at" value={slot.endsAt} />
                <button
                  type="submit"
                  className="w-full rounded-xl border border-navy/15 py-3 text-[14px] font-medium text-navy transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                >
                  {slot.label}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {!user && (
        <p className="mt-6 text-[14px] text-navy/60">
          Picking a time will ask you to{" "}
          <a href="/sign-in?next=/book" className="font-semibold text-emerald-700">
            sign in
          </a>
          .
        </p>
      )}
    </main>
  );
}
```

(Task 10 restyles this JSX with `Card`/tokens — this step's only job is removing `Nav`/`Footer` without changing anything else, so the diff here stays reviewable on its own.)

In `src/app/(site)/account/page.tsx`, apply the same removal: delete the `Nav`/`Footer` imports and renders, keep everything else — including the `redirect("/sign-in?next=/account")` guard — exactly as it is. The function returns the `<main>` element directly instead of a fragment wrapping `<Nav>`, `<main>`, `<Footer>`.

`src/app/(auth)/sign-in/page.tsx` and `src/app/(auth)/sign-up/page.tsx` need NO content changes at all — they never rendered `Nav`/`Footer` (a deliberate Phase 2 decision, preserved). Moving them into `(auth)/` is a pure location change.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean. Check the build's route output lists exactly: `/`, `/book`, `/account`, `/sign-in`, `/sign-up` — the route group folders must NOT appear as URL segments.

- [ ] **Step 3: Manual test**

Start the dev server, use curl (no browser available in this environment):
```bash
curl -s http://localhost:3000/ | grep -o "Whole Game" # homepage still renders
curl -s http://localhost:3000/book | grep -o "Book a court" # /book still works, not /site/book
curl -s -i http://localhost:3000/account | grep -i "location:" # still redirects to /sign-in when signed out
curl -s http://localhost:3000/sign-in | grep -o "Sign in" # auth pages still work, still chromeless
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: route groups for persistent header/footer"
```

---

### Task 3: Page transitions with `next-view-transitions`

**Files:**
- Modify: `package.json`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`
- Create: `src/components/ui/PageTransition.tsx`
- Modify: `src/components/Nav.tsx` (Link import + header anchoring)
- Modify: `src/components/ui/Button.tsx` (Link import)
- Modify: `src/components/sections/Footer.tsx` (Link import)
- Modify: `src/components/Hero.tsx` (Link import)
- Modify: `src/components/sections/Programs.tsx` (Link import)
- Modify: `src/app/(site)/page.tsx` (wrap in `PageTransition`)
- Modify: `src/app/(site)/book/page.tsx` (wrap in `PageTransition`)
- Modify: `src/app/(site)/account/page.tsx` (wrap in `PageTransition`)

**Interfaces:**
- Produces: `PageTransition` component (`children: ReactNode`) — Tasks 5-10's new pages wrap their content in this exact component.

- [ ] **Step 1: Install the dependency**

```bash
npm install next-view-transitions
```

Confirm in `package.json` afterward that it landed under `dependencies` (not `devDependencies`) with a real resolved version, not `"latest"` — the exact reproducibility issue Phase 2's fix wave corrected once already.

- [ ] **Step 2: Wrap the root layout**

In `src/app/layout.tsx`, add the import and wrap the existing `<html>` element — do not change anything else in this file (the fonts, the metadata, the skip link, the noscript block all stay exactly as they are):

```tsx
import { ViewTransitions } from "next-view-transitions";
```

Wrap the returned JSX's outermost `<html>` in `<ViewTransitions>`:

```tsx
  return (
    <ViewTransitions>
      <html
        lang="en"
        className={`${inter.variable} ${playfair.variable} h-full antialiased`}
      >
        {/* ...everything else in this file, unchanged... */}
      </html>
    </ViewTransitions>
  );
```

- [ ] **Step 3: Swap every `next/link` import for `next-view-transitions`**

The package's `Link` is a drop-in replacement (same `href`/`className`/`children` props) — only the import source changes, in exactly these six files:

- `src/components/Nav.tsx`
- `src/components/ui/Button.tsx`
- `src/components/sections/Footer.tsx`
- `src/components/Hero.tsx`
- `src/components/sections/Programs.tsx`

In each file, change:
```ts
import Link from "next/link";
```
to:
```ts
import { Link } from "next-view-transitions";
```

Every other usage of `<Link href=... >` in these files stays byte-for-byte the same — this is an import-source change only, not a usage change. (`src/app/(site)/page.tsx`'s own `<a href="/sign-up">`/`<a href="/sign-in">`-style plain anchors in `book/page.tsx` and elsewhere are plain `<a>` tags, not `next/link`'s `Link` — leave those alone; they're server-rendered pages linking to routes outside a client transition context, and converting them isn't required for this phase's ask.)

- [ ] **Step 4: Write the PageTransition wrapper**

Create `src/components/ui/PageTransition.tsx`:

```tsx
/**
 * Wraps a page's content so route changes get the native browser View
 * Transition API's fade+slide, driven by next-view-transitions (see
 * ViewTransitions in the root layout) rather than a bundled animation
 * library. The actual animation is plain CSS on the ::view-transition-*
 * pseudo-elements in globals.css — this component only marks where the
 * transitioned region starts. A <main> element it wraps keeps its own id
 * and className exactly as each page already sets them.
 */
export default function PageTransition({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

This is intentionally a passthrough: the actual transition trigger is `next-view-transitions`'s router-level interception (already wired by swapping `Link` and wrapping the root layout in Step 2-3), not per-page markup. Keeping this component in the tree gives every page one obvious, named place to wrap — and a single seam if a future page-level transition variant (e.g. a same-route crossfade) is ever added — without that page needing to know how the transition actually fires underneath.

- [ ] **Step 5: Apply the CSS**

In `src/app/globals.css`, add after the existing reduced-motion block:

```css
/* Page transitions, driven by next-view-transitions (see ViewTransitions
   in the root layout) wrapping the native browser View Transition API.
   No JS animation library — this is the entire animation. */
::view-transition-old(root) {
  animation:
    150ms ease-in both page-fade-out,
    220ms ease-in-out both page-slide-out;
}
::view-transition-new(root) {
  animation:
    220ms ease-in-out 60ms both page-fade-in,
    260ms ease-in-out both page-slide-in;
}

@keyframes page-fade-out {
  to { opacity: 0; }
}
@keyframes page-fade-in {
  from { opacity: 0; }
}
@keyframes page-slide-out {
  to { transform: translateY(-10px); }
}
@keyframes page-slide-in {
  from { transform: translateY(10px); }
}

/* The browser's View Transition API snapshots the WHOLE viewport by
   default — including Nav, which never actually unmounts (it lives in
   (site)/layout.tsx, shared across every route below it). Without this,
   Nav would still visibly flash because the snapshot doesn't know about
   React's tree, only what's on screen. Naming it and killing its own
   transition keeps it visually still while page content moves under it. */
nav[data-site-nav] {
  view-transition-name: site-nav;
}
::view-transition-group(site-nav) {
  animation: none;
  z-index: 100;
}
::view-transition-old(site-nav) {
  display: none;
}
::view-transition-new(site-nav) {
  animation: none;
}

/* The transition overlay captures pointer events by default; without this,
   a click during the ~260ms transition is silently lost. */
::view-transition {
  pointer-events: none;
}
```

Add `nav[data-site-nav]` matching attribute to `Nav`'s root `<header>` element in `src/components/Nav.tsx` — Step 6 below.

Extend the existing `@media (prefers-reduced-motion: reduce)` block (do not create a second one) with:

```css
  ::view-transition-old(*),
  ::view-transition-new(*),
  ::view-transition-group(*) {
    animation-duration: 0.01ms !important;
    animation-delay: 0ms !important;
  }
```

- [ ] **Step 6: Anchor the header**

In `src/components/Nav.tsx`, add the `data-site-nav` attribute to the root `<header>` element (the one with `className={\`fixed inset-x-0 top-0 z-50...\`}`):

```tsx
    <header
      data-site-nav
      className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[height,background-color,border-color] duration-300 ${
        scrolled ? "h-[60px] border-white/10 bg-navy/95" : "h-[72px] border-white/10 bg-navy/25"
      }`}
    >
```

- [ ] **Step 7: Wrap the three existing (site) pages in PageTransition**

In `src/app/(site)/page.tsx`, `src/app/(site)/book/page.tsx`, and `src/app/(site)/account/page.tsx`, import `PageTransition` and wrap the returned `<main>` element in it:

```tsx
import PageTransition from "@/components/ui/PageTransition";
```

```tsx
  return (
    <PageTransition>
      <main id="main" ...>
        {/* unchanged content */}
      </main>
    </PageTransition>
  );
```

- [ ] **Step 8: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 9: Manual test**

You have no browser in this environment — this step genuinely needs one. Note in your report which parts you could verify (build/lint clean, the CSS is syntactically valid, `grep` confirms every `next/link` import was swapped) and which need the controller or the user to confirm visually: does a real route change in Chrome/Edge actually show the fade+slide, does the header stay visibly still, does a click during the transition still register, does disabling animations in OS accessibility settings produce an instant swap.

```bash
grep -rn 'from "next/link"' src/components/ # expect ZERO results after this task
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(ui): native page transitions via next-view-transitions"
```

---

### Task 4: Suspense loading states on the homepage's data-fetching sections

**Files:**
- Modify: `src/app/(site)/page.tsx`

**Interfaces:**
- Consumes: `Skeleton` (existing), `Programs`/`Coaches` (existing, both already `async` Server Components fetching Supabase data).

Next's `<Suspense>` shows its `fallback` while a wrapped async Server Component is still resolving, and swaps to the real content the instant it's ready — this is the "skeleton instead of blank flash" requirement, and it needs no new component: `Skeleton` already exists and is already used inside `Programs`/`Coaches` for individual image slots. This task wraps the whole section, not just its images, so a slow query shows a full-section skeleton rather than a section that renders instantly with only its images pending.

- [ ] **Step 1: Write section-shaped skeleton fallbacks inline**

In `src/app/(site)/page.tsx`, import `Suspense` from `"react"` and `Skeleton` from `"@/components/ui/Skeleton"`. Wrap `<Programs />` and `<Coaches />` — the two sections that query Supabase — each in their own `<Suspense>`:

```tsx
import { Suspense } from "react";
import Skeleton from "@/components/ui/Skeleton";
```

```tsx
      <Suspense
        fallback={
          <div className="bg-cream py-20 sm:py-28">
            <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="mt-4 h-10 w-96 max-w-full rounded-lg" />
              <div className="mt-14 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] rounded-[var(--radius-card)]" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <Programs />
      </Suspense>
```

```tsx
      <Suspense
        fallback={
          <div className="bg-cream py-20 sm:py-28">
            <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="mt-4 h-10 w-96 max-w-full rounded-lg" />
              <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-[var(--radius-card)]" />
                ))}
              </div>
            </div>
          </div>
        }
      >
        <Coaches />
      </Suspense>
```

Replace the plain `<Programs />` and `<Coaches />` lines in the existing JSX with these two blocks, in the same position in the section order (Programs stays between BookingBar and HowItWorks; Coaches stays between HowItWorks and Pricing).

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/ | grep -o "Private Coaching\|Marcus Vaughn"
```
Confirms the real content still renders server-side (Suspense fallbacks only appear during actual streaming/slow-network conditions — a fast local Supabase response means the fallback may never visibly show in a quick curl check, which is correct, not a failure to verify).

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/page.tsx
git commit -m "feat(ui): Suspense loading skeletons for data-fetching homepage sections"
```

---

### Task 5: `/courts` page

**Files:**
- Create: `src/app/(site)/courts/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `Court` type (existing), `SectionHead`/`Card`/`Button`/`PageTransition` (existing/Task 1/Task 3), `site.hours` (existing, `@/content/site`).

- [ ] **Step 1: Write the page**

Create `src/app/(site)/courts/page.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/courts | grep -o "Court 1\|Court 2\|Court 3\|Eight courts"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/courts
git commit -m "feat: /courts page"
```

---

### Task 6: `/coaching` page

**Files:**
- Create: `src/app/(site)/coaching/page.tsx`

**Interfaces:**
- Consumes: `createClient()`, `getPublicImageUrl()`, `Coach` type (existing), `SectionHead`/`Card`/`PageTransition`, `Skeleton` (existing).

- [ ] **Step 1: Write the page**

Create `src/app/(site)/coaching/page.tsx`:

```tsx
import Image from "next/image";
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/server";
import { getPublicImageUrl } from "@/lib/supabase/storage";
import type { Coach } from "@/lib/supabase/types";

export default async function CoachingPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("active", true)
    .order("years", { ascending: false });
  if (error) throw error;
  const coaches = (data ?? []) as Coach[];

  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[1400px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="The coaches"
          title="Certified, and still competing."
          lede="Every coach on this floor holds a current governing-body certification and plays league tennis themselves."
        />

        <ul className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {coaches.map((c) => {
            const image = getPublicImageUrl(c.photo_path);
            return (
              <li key={c.id} className="group">
                <Card className="overflow-hidden">
                  <div className="relative aspect-[4/5]">
                    {image ? (
                      <Image
                        src={image}
                        alt={`${c.name}, ${c.role}`}
                        fill
                        sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <Skeleton className="absolute inset-0" />
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-display text-[23px] leading-tight text-navy">{c.name}</h3>
                      <span className="shrink-0 text-[13px] font-medium text-navy/50">{c.years} yrs</span>
                    </div>
                    <p className="mt-2 inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-emerald-700">
                      <span className="size-1.5 rounded-full bg-gold" aria-hidden="true" />
                      {c.role} · {c.cert}
                    </p>
                    <p className="mt-2 text-[15px] leading-[1.6] text-navy/65">{c.focus}</p>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </main>
    </PageTransition>
  );
}
```

Note the border moves from the image wrapper (homepage version) to `Card` itself, and padding is added around the text block since `Card` no longer implicitly stops at the image — this is a deliberate, small layout difference from the homepage strip, matching the spec's "own structure, same visual language" instruction rather than a pixel-identical copy.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/coaching | grep -o "Marcus Vaughn\|Priya Raman\|Danny Oyelaran"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/coaching
git commit -m "feat: /coaching page"
```

---

### Task 7: `/membership` page

**Files:**
- Create: `src/app/(site)/membership/page.tsx`

**Interfaces:**
- Consumes: `pricing` array (existing, `@/content/site`), `SectionHead`/`Card`/`Button`/`PageTransition`.

- [ ] **Step 1: Write the page**

Create `src/app/(site)/membership/page.tsx`:

```tsx
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
```

The `if (!membership) throw` guard is deliberate: `pricing` is a hand-written array with no schema enforcing a `"Membership"` tier exists, and a page that silently rendered nothing if that entry were ever renamed would be a harder bug to spot than a build/runtime error naming exactly what's missing.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/membership | grep -o "₱3,500\|Eight court hours"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/membership
git commit -m "feat: /membership page"
```

---

### Task 8: `/results` page

**Files:**
- Create: `src/app/(site)/results/page.tsx`

**Interfaces:**
- Consumes: `stats`, `testimonials` arrays (existing, `@/content/site`), `SectionHead`/`Card`/`PageTransition`.

- [ ] **Step 1: Write the page**

Create `src/app/(site)/results/page.tsx`:

```tsx
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import Card from "@/components/ui/Card";
import { stats, testimonials } from "@/content/site";

export default function ResultsPage() {
  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[1000px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead
          eyebrow="Results"
          title="What members actually say."
          lede="No leaderboard, no tournament bracket yet — just the people who kept showing up."
        />

        <dl className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-6 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-[clamp(2rem,4vw,2.75rem)] leading-none text-navy">
                  {s.value}
                </span>
                <span className="mt-2 block text-[13px] uppercase tracking-[0.14em] text-emerald-700">
                  {s.label}
                </span>
              </dd>
            </Card>
          ))}
        </dl>

        <ul className="mt-10 space-y-6">
          {testimonials.map((t) => (
            <li key={t.name}>
              <Card className="p-8">
                <blockquote className="font-display text-[clamp(1.25rem,2.2vw,1.6rem)] leading-[1.4] text-navy">
                  <p>&ldquo;{t.quote}&rdquo;</p>
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="h-px w-8 bg-gold" aria-hidden="true" />
                  <span className="text-[15px] font-semibold text-navy">{t.name}</span>
                  <span className="text-[14px] text-navy/55">{t.detail}</span>
                </figcaption>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </PageTransition>
  );
}
```

Note this page uses `Card`'s `default` variant (light) throughout, unlike the homepage's `Proof` section which sits on a navy band — a deliberate light-page treatment matching this page's own context, not a copy of the homepage section's dark background.

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/results | grep -o "600+\|Tom Bassett"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/results
git commit -m "feat: /results page"
```

---

### Task 9: `/faqs` page

**Files:**
- Create: `src/app/(site)/faqs/page.tsx`

**Interfaces:**
- Consumes: `faqs` array (existing, `@/content/site`), the existing `.disclosure` CSS class (already in `globals.css`, built in an earlier phase for the homepage FAQ accordion), `SectionHead`/`PageTransition`.

- [ ] **Step 1: Write the page**

Create `src/app/(site)/faqs/page.tsx`, reusing the exact accordion markup/CSS class already proven on the homepage's `Faq.tsx`:

```tsx
import PageTransition from "@/components/ui/PageTransition";
import SectionHead from "@/components/ui/SectionHead";
import { faqs } from "@/content/site";

export default function FaqsPage() {
  return (
    <PageTransition>
      <main id="main" className="mx-auto max-w-[800px] px-5 pb-20 pt-[110px] sm:px-8">
        <SectionHead eyebrow="FAQs" title="Before you book." />

        <div className="mt-10">
          {faqs.map((f) => (
            <details key={f.q} className="disclosure group border-b border-navy/12 first:border-t">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[17px] font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden="true"
                  className="relative size-5 shrink-0 text-emerald-700 transition-transform duration-300 group-open:rotate-45"
                >
                  <span className="absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current" />
                  <span className="absolute left-1/2 top-0 h-5 w-0.5 -translate-x-1/2 rounded bg-current" />
                </span>
              </summary>
              <p className="pb-7 pr-10 text-[16px] leading-[1.7] text-navy/70">{f.a}</p>
            </details>
          ))}
        </div>
      </main>
    </PageTransition>
  );
}
```

- [ ] **Step 2: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

- [ ] **Step 3: Manual test**

```bash
curl -s http://localhost:3000/faqs | grep -o "Do I need my own racket"
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(site\)/faqs
git commit -m "feat: /faqs page"
```

---

### Task 10: Refactor existing sections onto `Card`, restyle `/book`

**Files:**
- Modify: `src/components/sections/Programs.tsx`
- Modify: `src/components/sections/Coaches.tsx`
- Modify: `src/components/sections/Pricing.tsx`
- Modify: `src/app/(site)/book/page.tsx`

**Interfaces:**
- Consumes: `Card` (Task 1). No new interfaces produced — this is the last task.

- [ ] **Step 1: Refactor Programs.tsx onto Card**

In `src/components/sections/Programs.tsx`, replace the hand-rolled image-wrapper `div` (`className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-navy/10"`) with `Card`:

```tsx
import Card from "@/components/ui/Card";
```

```tsx
                <Card className="relative aspect-[4/3] overflow-hidden">
                  {image ? (
                    <Image
                      src={image}
                      alt=""
                      fill
                      sizes="(min-width:1024px) 23vw, (min-width:640px) 46vw, 92vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  ) : (
                    <Skeleton className="absolute inset-0" />
                  )}
                  <div className="absolute inset-0 transition-colors duration-300 group-hover:bg-navy/[0.06]" />
                </Card>
```

Everything else in the file (the `<h3>`, price line, arrow icon, `Reveal`/`stagger` wrapper) stays exactly as it is — only the card `div` becomes `Card`.

- [ ] **Step 2: Refactor Coaches.tsx onto Card**

In `src/components/sections/Coaches.tsx`, the same swap on its image wrapper:

```tsx
import Card from "@/components/ui/Card";
```

```tsx
                <Card className="relative aspect-[4/5] overflow-hidden">
                  {image ? (
                    <Image
                      src={image}
                      alt={`${c.name}, ${c.role}`}
                      fill
                      sizes="(min-width:1024px) 31vw, (min-width:640px) 46vw, 92vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <Skeleton className="absolute inset-0" />
                  )}
                </Card>
```

- [ ] **Step 3: Refactor Pricing.tsx onto Card**

In `src/components/sections/Pricing.tsx`, replace the `<li>`'s conditional className (the `p.featured ? "rounded-2xl bg-navy..." : "rounded-2xl border border-navy/10 bg-cream..."` ternary) with `Card`, keeping the `<li>` as the list item and `Card` as its direct child:

```tsx
import Card from "@/components/ui/Card";
```

```tsx
            <li key={p.tier}>
              <Card
                variant={p.featured ? "featured" : "default"}
                className={p.featured ? "p-8 sm:p-10 lg:-mt-6" : "p-8 sm:p-10"}
              >
                {/* everything currently inside the <li>'s div — the tier name,
                    price, features list, Button — moves inside Card unchanged */}
              </Card>
            </li>
```

The `lg:-mt-6` (the featured tier's raised position) moves into `Card`'s `className` prop alongside the padding, since `Card` now owns the element that used to carry both the background/border AND that offset.

- [ ] **Step 4: Restyle `/book` with Card and the radius token**

In `src/app/(site)/book/page.tsx`, wrap the availability form and the slot-list in `Card`, matching the visual language now established everywhere else. Replace:

```tsx
        <form method="get" className="mt-8 grid gap-4 sm:grid-cols-3">
```

with:

```tsx
        <Card as="form" method="get" className="mt-8 grid gap-4 p-6 sm:grid-cols-3 sm:p-8">
```

This requires `Card` to support rendering as a different element than `div` — add an `as` prop to `Card` (Task 1's component), matching the same polymorphic pattern `Reveal` already uses elsewhere in this codebase:

Back in `src/components/ui/Card.tsx` (a small addition to Task 1's file, made now because this is the first place that actually needs it — YAGNI, not speculative):

```tsx
export default function Card({
  as: Tag = "div",
  variant = "default",
  className = "",
  children,
  ...rest
}: {
  as?: React.ElementType;
  variant?: "default" | "featured";
  className?: string;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const base =
    variant === "featured"
      ? "rounded-[var(--radius-card)] bg-navy text-white shadow-[0_24px_60px_-24px_rgba(15,36,48,0.55)]"
      : "rounded-[var(--radius-card)] border border-navy/10 bg-cream";

  return (
    <Tag className={`${base} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
```

Then close the `</form>` that was previously plain — change it to `</Card>` at the matching closing tag.

Also wrap each time-slot button's containing `<li>`'s `<form>` is NOT changed (those stay plain forms — only the main availability-search form and the overall page's supporting blocks get the Card treatment). Wrap the "no slots" message and the available-times section in a `Card` for visual consistency with the rest of the page:

```tsx
      <Card className="mt-6 p-6 sm:p-8">
        <h2 className="text-[15px] font-semibold uppercase tracking-[0.1em] text-navy/60">
          Available times, {selectedDate}
        </h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-[15px] text-navy/60">No open slots this day. Try another date.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* slot buttons, unchanged */}
          </ul>
        )}
      </Card>
```

- [ ] **Step 5: Verify the build and lint**

```bash
npm run build
npx eslint src --max-warnings=0
```

Both clean.

- [ ] **Step 6: Manual test**

```bash
curl -s http://localhost:3000/ | grep -o "Private Coaching\|Marcus Vaughn\|Membership"
curl -s http://localhost:3000/book | grep -o "Book a court\|Check availability"
```
Confirm the homepage's three refactored sections and `/book` still render their real content — this task changes styling structure, not data or copy, so every string that was present before must still be present now.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "refactor(ui): Programs/Coaches/Pricing/book onto the Card primitive"
```

---

## Self-Review

**Spec coverage:**
- Route groups for persistent header/footer → Task 2. ✓
- Extended `@theme` tokens (radius, type scale), not a duplicate file → Task 1. ✓
- `Card` primitive, three existing call sites + new pages → Tasks 1, 5-10. ✓
- Native `<ViewTransition>` fallback resolved (canary gap found, user chose `next-view-transitions`) → Task 3. ✓
- Fade + ~10px slide, 200-300ms range → Task 3 Step 5 (150-260ms across the enter/exit split, inside range). ✓
- Header stays visually anchored → Task 3 Steps 5-6. ✓
- Suspense/Skeleton loading state → Task 4. ✓
- `prefers-reduced-motion` → Task 3 Step 5's reduced-motion CSS addition. ✓
- Five pages, each pulling real existing data, no invented content → Tasks 5-9. ✓
- `/book` restyle, zero logic change → Task 2 Step 3 (the move) + Task 10 Step 4 (the actual restyle, kept separate so the move's diff stays reviewable on its own). ✓

**Placeholder scan:** no TBD/TODO. Every step has complete code or an exact shell command; Task 3 Step 9 and the sign-in/sign-up "no content changes" note are the only places without a code block, and both are explicit statements of fact (a genuine environment limitation; a genuine no-op), not deferred work.

**Type consistency:** `Card`'s prop shape (`as`, `variant`, `className`, `children`) is defined once in Task 1 and extended once in Task 10 Step 4 (the `as` prop, added when the first real consumer needs it) — every other call site (Tasks 5-9, Task 10 Steps 1-3) uses only `variant`/`className`/`children`, a strict subset, so no earlier usage breaks when `as` is added. `PageTransition`'s single prop (`children`) is identical everywhere it's used (Task 3 Step 7, Tasks 5-9).

**Scope check:** ten tasks, one subsystem (navigation, transitions, and the shared visual system), no independent second subsystem hiding inside it. Real photography and any future directional (forward/back) transition work are explicitly out of scope, carried in the spec's own "Open items" section.
