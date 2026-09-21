/**
 * Hand-written row types matching supabase/migrations/0001_init.sql exactly.
 * No generated-types step in this project (see spec: no local Supabase CLI
 * dependency) — if a column is added to the schema, add it here by hand.
 */

export type Venue = {
  id: string;
  name: string;
  active: boolean;
};

export type Court = {
  id: string;
  venue_id: string;
  name: string;
  active: boolean;
};

export type Coach = {
  id: string;
  name: string;
  role: string;
  cert: string | null;
  years: number | null;
  focus: string | null;
  photo_path: string | null;
  active: boolean;
};

export type Program = {
  id: string;
  slug: string;
  title: string;
  blurb: string | null;
  price_from: number;
  price_unit: string;
  photo_path: string | null;
};

export type Profile = {
  id: string;
  role: "player" | "admin";
  full_name: string | null;
  phone: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  court_id: string;
  player_id: string;
  coach_id: string | null;
  program_id: string;
  starts_at: string;
  ends_at: string;
  status: "confirmed" | "cancelled";
  cancelled_at: string | null;
  created_at: string;
};

export type Membership = {
  id: string;
  player_id: string;
  status: "active" | "paused" | "cancelled";
  hours_remaining: number;
  renews_on: string | null;
  updated_by: string | null;
  updated_at: string;
};
