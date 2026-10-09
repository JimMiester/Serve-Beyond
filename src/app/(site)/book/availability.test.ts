import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "./availability";

/** Next date (at least `minDaysOut` ahead, so "today's hours already
 * passed" never makes a test flaky) that falls on the given weekday —
 * computed relative to the real clock rather than a hardcoded date, so
 * these tests keep working regardless of when they're run. */
function nextDateOnWeekday(dow: number, minDaysOut = 3): string {
  const d = new Date();
  d.setDate(d.getDate() + minDaysOut);
  while (d.getDay() !== dow) d.setDate(d.getDate() + 1);
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

const GROUP = "group-program-id";
const PRIVATE = "private-program-id";

describe("computeAvailableSlots", () => {
  it("excludes slots that have already started", () => {
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const slots = computeAvailableSlots(today, [], [], GROUP, 4);
    const nowHour = Number(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", hour12: false }),
    );
    for (const slot of slots) {
      const slotHour = Number(
        new Date(slot.startsAt).toLocaleString("en-US", { timeZone: "Asia/Manila", hour: "2-digit", hour12: false }),
      );
      expect(slotHour).toBeGreaterThan(nowHour);
    }
  });

  it("offers Monday–Friday hours of 06:00–21:00 (last slot starts at 21:00, closes 22:00)", () => {
    const monday = nextDateOnWeekday(1);
    const slots = computeAvailableSlots(monday, [], [], GROUP, 4);
    expect(slots[0].label).toBe("6:00 AM");
    expect(slots.at(-1)?.label).toBe("9:00 PM");
    expect(slots).toHaveLength(16);
  });

  it("offers Saturday hours of 07:00–20:00", () => {
    const saturday = nextDateOnWeekday(6);
    const slots = computeAvailableSlots(saturday, [], [], GROUP, 4);
    expect(slots[0].label).toBe("7:00 AM");
    expect(slots.at(-1)?.label).toBe("7:00 PM");
    expect(slots).toHaveLength(13);
  });

  it("offers Sunday hours of 08:00–18:00", () => {
    const sunday = nextDateOnWeekday(0);
    const slots = computeAvailableSlots(sunday, [], [], GROUP, 4);
    expect(slots[0].label).toBe("8:00 AM");
    expect(slots.at(-1)?.label).toBe("5:00 PM");
    expect(slots).toHaveLength(10);
  });

  it("blocks a slot the player already has elsewhere, regardless of programme or capacity", () => {
    const monday = nextDateOnWeekday(1);
    const startsAt = new Date(`${monday}T06:00:00+08:00`).toISOString();
    const endsAt = new Date(`${monday}T07:00:00+08:00`).toISOString();
    const slots = computeAvailableSlots(monday, [], [{ starts_at: startsAt, ends_at: endsAt }], GROUP, 4);
    expect(slots.find((s) => s.startsAt === startsAt)).toBeUndefined();
  });

  it("blocks a slot already booked by a different programme on the same court", () => {
    const monday = nextDateOnWeekday(1);
    const startsAt = new Date(`${monday}T06:00:00+08:00`).toISOString();
    const endsAt = new Date(`${monday}T07:00:00+08:00`).toISOString();
    const slots = computeAvailableSlots(
      monday,
      [{ starts_at: startsAt, ends_at: endsAt, program_id: PRIVATE }],
      [],
      GROUP,
      4,
    );
    expect(slots.find((s) => s.startsAt === startsAt)).toBeUndefined();
  });

  it("allows the same slot to be shared by the same programme up to capacity", () => {
    const monday = nextDateOnWeekday(1);
    const startsAt = new Date(`${monday}T06:00:00+08:00`).toISOString();
    const endsAt = new Date(`${monday}T07:00:00+08:00`).toISOString();
    // 3 existing Group Clinics bookings, capacity 4 — a 4th should still fit.
    const existing = Array.from({ length: 3 }, () => ({ starts_at: startsAt, ends_at: endsAt, program_id: GROUP }));
    const slots = computeAvailableSlots(monday, existing, [], GROUP, 4);
    expect(slots.find((s) => s.startsAt === startsAt)).toBeDefined();
  });

  it("blocks the same slot once the programme's capacity is reached", () => {
    const monday = nextDateOnWeekday(1);
    const startsAt = new Date(`${monday}T06:00:00+08:00`).toISOString();
    const endsAt = new Date(`${monday}T07:00:00+08:00`).toISOString();
    const existing = Array.from({ length: 4 }, () => ({ starts_at: startsAt, ends_at: endsAt, program_id: GROUP }));
    const slots = computeAvailableSlots(monday, existing, [], GROUP, 4);
    expect(slots.find((s) => s.startsAt === startsAt)).toBeUndefined();
  });

  it("treats Private Coaching (capacity 1) as full after a single booking", () => {
    const monday = nextDateOnWeekday(1);
    const startsAt = new Date(`${monday}T06:00:00+08:00`).toISOString();
    const endsAt = new Date(`${monday}T07:00:00+08:00`).toISOString();
    const existing = [{ starts_at: startsAt, ends_at: endsAt, program_id: PRIVATE }];
    const slots = computeAvailableSlots(monday, existing, [], PRIVATE, 1);
    expect(slots.find((s) => s.startsAt === startsAt)).toBeUndefined();
  });
});
