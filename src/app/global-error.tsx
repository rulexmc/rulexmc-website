"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#050405", color: "#f4eeee", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center" }}>
          <h1>RuleXMC is having trouble</h1>
          <p>Please try again in a moment.</p>
          <button type="button" onClick={reset} style={{ background: "#ef1c2b", color: "#fff", border: 0, padding: "10px 18px", borderRadius: 6, cursor: "pointer" }}>Try again</button>
        </div>
      </body>
    </html>
  );
}
