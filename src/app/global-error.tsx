"use client";

/** Last-resort boundary (root layout failed), so it can't rely on Tailwind or fonts. */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", padding: 24,
          background: "radial-gradient(800px 400px at 50% 0%, rgba(165,12,31,0.35), transparent 70%), #040304",
          color: "#f5efef", fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        }}
      >
        <main style={{ textAlign: "center", maxWidth: 440 }}>
          <p style={{ letterSpacing: "0.3em", textTransform: "uppercase", fontSize: 12, color: "#f0414f", margin: 0 }}>RuleX MC</p>
          <h1 style={{ fontSize: 28, margin: "12px 0" }}>We&apos;re having trouble</h1>
          <p style={{ color: "#c8bdbe", lineHeight: 1.6 }}>Please try again in a moment.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 16, background: "linear-gradient(#d01229, #720816)", color: "#fff", border: "1px solid rgba(240,65,79,0.5)", padding: "12px 22px", borderRadius: 8, cursor: "pointer", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
