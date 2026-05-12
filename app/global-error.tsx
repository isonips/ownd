"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body style={{ background: "#05070a", color: "#f5f7fa", fontFamily: "system-ui", padding: 32, textAlign: "center" }}>
        <div style={{ fontSize: 48 }}>🏃</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, marginTop: 12 }}>Something broke</h1>
        <p style={{ opacity: 0.7, marginTop: 8 }}>Please retry, or come back in a moment.</p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 20, padding: "12px 22px", borderRadius: 9999,
            background: "linear-gradient(180deg,#7CE6BE,#3DA579)", color: "#052016",
            fontWeight: 800, border: 0,
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
