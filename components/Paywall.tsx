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
      className="card mt-4 text-center relative overflow-hidden"
      style={{
        background:
          "radial-gradient(120% 80% at 50% 0%, rgba(109,208,169,0.18), rgba(20,22,28,0.78) 60%)",
      }}
    >
      <div className="chip mx-auto" style={{ color: "#6DD0A9", borderColor: "rgba(109,208,169,0.35)" }}>
        ★ Premium
      </div>
      <div className="mt-3 text-2xl font-black tracking-tight">Unlock everything</div>
      <p className="text-white/70 mt-1 text-sm">{message}</p>
      <div className="mt-3 stat-num text-5xl glow-own" style={{ color: "#6DD0A9" }}>
        5€<span className="text-base text-white/60 font-bold ml-1">/ month</span>
      </div>
      <button onClick={go} disabled={busy} className="btn w-full mt-4">
        {busy ? "Loading…" : "Go Premium"}
      </button>
    </div>
  );
}
