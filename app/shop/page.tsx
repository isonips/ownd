"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

const ITEMS = [
  { type: "shield",  title: "Shield",  desc: "Block steals for 24h.",          price: "5 USDC", hours: 24, emoji: "🛡️", tone: "#6DD0A9" },
  { type: "boost",   title: "Boost",   desc: "+10 score on your next run.",    price: "3 USDC", hours: 24, emoji: "⚡", tone: "#F59E0B" },
  { type: "radar",   title: "Radar",   desc: "See rivals' streaks for 24h.",   price: "2 USDC", hours: 24, emoji: "📡", tone: "#7aa3ff" },
  { type: "contest", title: "Contest", desc: "Instantly contest a street.",    price: "8 USDC", hours: 1,  emoji: "⚔️", tone: "#EF4444" },
];

export default function ShopPage() {
  const [buying, setBuying] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
    setMsg(error ? error.message : `${type} acquired`);
    setTimeout(() => setMsg(null), 2500);
  }

  return (
    <div className="px-5 pt-6">
      <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Shop</div>
      <h1 className="text-3xl font-black tracking-tight">Power-ups</h1>
      <p className="text-white/60 text-sm mt-1">Paid in USDC. Simulated for MVP.</p>

      <div className="grid grid-cols-2 gap-3 mt-5">
        {ITEMS.map((it) => (
          <div key={it.type} className="card !p-4">
            <div
              className="w-12 h-12 rounded-2xl grid place-items-center text-2xl"
              style={{ background: `${it.tone}20`, boxShadow: `0 0 24px ${it.tone}33` }}
            >
              <span>{it.emoji}</span>
            </div>
            <div className="mt-3 font-black text-lg">{it.title}</div>
            <div className="text-xs text-white/60 mt-0.5 leading-snug">{it.desc}</div>
            <div className="mt-3 flex items-center justify-between">
              <div className="font-bold" style={{ color: it.tone }}>{it.price}</div>
            </div>
            <button
              className="btn w-full mt-3 !py-3 !text-sm"
              onClick={() => buy(it.type, it.hours)}
              disabled={buying === it.type}
            >
              {buying === it.type ? "Buying…" : "Buy"}
            </button>
          </div>
        ))}
      </div>
      {msg && <div className="toast bg-own text-black">{msg}</div>}
    </div>
  );
}
