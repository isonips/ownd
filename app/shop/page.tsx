"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const ITEMS = [
  { type: "shield",  title: "Shield",  desc: "Block steals for 24 hours.",     price: 5, hours: 24, accent: "var(--mint)" },
  { type: "boost",   title: "Boost",   desc: "+10 score on your next run.",    price: 3, hours: 24, accent: "var(--cyan)" },
  { type: "radar",   title: "Radar",   desc: "Reveal rivals' streaks 24h.",    price: 2, hours: 24, accent: "var(--violet)" },
  { type: "contest", title: "Contest", desc: "Instantly contest a street.",    price: 8, hours: 1,  accent: "var(--pink)" },
];

function Glyph({ name, color }: { name: string; color: string }) {
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "shield":
      return <svg {...p}><path d="M12 3 4.5 6v6.5c0 4.5 3.2 7.6 7.5 8.5 4.3-0.9 7.5-4 7.5-8.5V6L12 3Z" /></svg>;
    case "boost":
      return <svg {...p}><path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" /></svg>;
    case "radar":
      return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 12 18 6" /><circle cx="12" cy="12" r="3" /></svg>;
    case "contest":
      return <svg {...p}><path d="M5 19 14 10" /><path d="m14 5 5 5-2 2-5-5 2-2Z" /><path d="m9 14-4 5 5-4" /></svg>;
  }
  return null;
}

export default function ShopPage() {
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "err" } | null>(null);

  async function buy(type: string, hours: number) {
    setBuying(type);
    const supabase = supabaseBrowser();
    const { data } = await supabase.auth.getUser();
    if (!data.user) { window.location.href = "/login"; return; }
    const expires = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const { error } = await supabase
      .from("power_ups")
      .insert({ user_id: data.user.id, type, expires_at: expires });
    setBuying(null);
    setMsg(error
      ? { text: error.message, tone: "err" }
      : { text: `${type} acquired`, tone: "ok" });
    setTimeout(() => setMsg(null), 2400);
  }

  return (
    <div className="px-5 pt-6">
      <div className="eyebrow">Shop</div>
      <h1 className="h-display text-[28px] mt-1">Power-ups</h1>
      <p className="text-[13px] mt-1" style={{ color: "var(--ink-3)" }}>
        Settle in USDC. Simulated for MVP.
      </p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        {ITEMS.map((it) => (
          <div key={it.type} className="card !p-4 flex flex-col">
            <div
              className="w-10 h-10 rounded-xl grid place-items-center"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--hairline)",
              }}
            >
              <Glyph name={it.type} color={it.accent} />
            </div>
            <div className="mt-3 font-semibold text-[15px]">{it.title}</div>
            <div className="text-[12px] mt-0.5 leading-snug" style={{ color: "var(--ink-3)" }}>
              {it.desc}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full token-coin" />
              <span className="num text-sm">{it.price}</span>
              <span className="eyebrow text-[10px]">USDC</span>
            </div>
            <button
              className="btn w-full mt-3"
              onClick={() => buy(it.type, it.hours)}
              disabled={buying === it.type}
            >
              {buying === it.type ? "Buying…" : "Buy"}
            </button>
          </div>
        ))}
      </div>

      {msg && (
        <div
          className="toast"
          style={{
            background: msg.tone === "ok" ? "rgba(43,203,163,0.18)" : "rgba(229,72,77,0.18)",
            color: msg.tone === "ok" ? "var(--mint)" : "#FFCFCF",
            borderColor: msg.tone === "ok" ? "rgba(43,203,163,0.45)" : "rgba(229,72,77,0.5)",
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}
