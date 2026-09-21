// One-shot correctness check for the pure availability calculator.
// Run with: node scripts/check-availability.ts
// This project's Node version runs plain TypeScript directly — no build step,
// no test framework, no dependency.
import { computeAvailableSlots } from "../src/app/book/availability.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${message}`);
  }
}

// No existing bookings: every hour from 06:00 to 21:00 inclusive should be
// free — 16 one-hour slots in a 06:00-22:00 window.
const empty = computeAvailableSlots("2030-01-01", []);
assert(empty.length === 16, `empty day has 16 slots (got ${empty.length})`);

// One existing booking (10:00-11:00 Manila time, expressed as the equivalent
// UTC instant) should exclude exactly one slot and leave 15.
const withBooking = computeAvailableSlots("2030-01-01", [
  { starts_at: "2030-01-01T02:00:00.000Z", ends_at: "2030-01-01T03:00:00.000Z" },
]);
assert(withBooking.length === 15, `one booking excludes exactly one slot (got ${withBooking.length} slots)`);
assert(
  !withBooking.some((s) => s.label.startsWith("10:")),
  "the booked 10 AM hour does not appear in the available list",
);

// A malformed date string must never reach the point of throwing inside
// computeAvailableSlots itself — this function receives whatever the caller
// already validated, so document that the caller (book/page.tsx, Fix 1
// above) is responsible for rejecting bad input before calling this.
console.log("Note: computeAvailableSlots assumes a valid YYYY-MM-DD date string; validation happens in book/page.tsx (see Fix 1).");

if (process.exitCode === 1) {
  console.error("\nOne or more checks failed.");
} else {
  console.log("\nAll checks passed.");
}
