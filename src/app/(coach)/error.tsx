"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

export default function CoachError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} homeHref="/coach" homeLabel="Back to coach home" />;
}
