"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html>
      <body
        style={{
          background: "#07080F",
          color: "#ECEEF3",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", opacity: 0.5 }}>
          Error
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 8, letterSpacing: "-0.02em" }}>
          Something broke
        </h1>
        <p style={{ opacity: 0.6, marginTop: 8, fontSize: 14 }}>
          Please retry, or come back in a moment.
        </p>
        <button
          onClick={() => reset()}
          style={{
            marginTop: 20,
            padding: "12px 22px",
            borderRadius: 12,
            background: "linear-gradient(180deg, #6FE6CF 0%, #2BCBA3 100%)",
            color: "#07120E",
            fontWeight: 600,
            border: "1px solid rgba(255,255,255,0.18)",
            cursor: "pointer",
          }}
        >
          Retry
        </button>
      </body>
    </html>
  );
}
