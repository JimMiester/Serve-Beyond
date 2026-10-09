"use client";

// Fires only if the root layout itself throws — everything else is caught
// by a route group's own error.tsx first. This replaces <html>/<body>
// entirely (there's no outer layout left to render into), so it's kept
// self-contained with inline styles rather than Tailwind classes or
// ErrorScreen, on the chance that whatever broke the root layout also
// affects the rest of the app shell.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          padding: 24,
          textAlign: "center",
          background: "#0a0f1a",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0 }}>Something went wrong</h1>
        <p style={{ color: "rgba(255,255,255,0.65)", maxWidth: 420, margin: 0 }}>
          That&rsquo;s on us, not something you did.
        </p>
        {error.digest && (
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0 }}>Reference: {error.digest}</p>
        )}
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 8,
            borderRadius: 999,
            border: "none",
            background: "#059669",
            color: "#ffffff",
            fontSize: 15,
            fontWeight: 600,
            padding: "12px 28px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
