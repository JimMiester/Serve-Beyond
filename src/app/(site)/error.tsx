"use client";

import ErrorScreen from "@/components/ui/ErrorScreen";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorScreen error={error} reset={reset} homeHref="/" homeLabel="Back home" />;
}
