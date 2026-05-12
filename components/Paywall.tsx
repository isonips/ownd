"use client";
import { useState } from "react";

export default function Paywall({ message }: { message: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    setBusy(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const { url, error } = await res.json();
    if (url) window.location.href = url;
    else { alert(error ?? "Could not start checkout"); setBusy(false); }
  }
  return (
    <div
      className="card mt-4 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 90% at 0% 0%, rgba(76,201,240,0.10), transparent 55%), radial-gradient(120% 90% at 100% 100%, rgba(139,92,246,0.10), transparent 55%), var(--surface)",
      }}
    >
      <div className="chip" style={{ color: "var(--mint)", borderColor: "rgba(118,244,223,0.35)" }}>
        Premium
      </div>
      <div className="mt-3 h-display text-[22px]">Unlock the full game.</div>
      <p className="mt-2 text-[13px]" style={{ color: "var(--ink-2)" }}>{message}</p>

      <ul className="mt-4 space-y-2">
        {["Full run history & streaks", "Global leaderboard", "Detailed analytics"].map((f) => (
          <li key={f} className="flex items-center gap-2 text-[13px]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mint)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 12 5 5L20 6" />
            </svg>
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="flex items-baseline gap-1 mt-5">
        <span className="num text-[34px]">5€</span>
        <span className="text-[13px]" style={{ color: "var(--ink-3)" }}>/ month</span>
      </div>
      <button onClick={go} disabled={busy} className="btn w-full mt-3">
        {busy ? "Loading…" : "Go Premium"}
      </button>
    </div>
  );
}
