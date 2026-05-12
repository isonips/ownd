"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function magic(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (!error) setSent(true);
  }
  async function google() {
    const supabase = supabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="px-5 pt-10">
      <div
        className="w-14 h-14 rounded-2xl grid place-items-center font-black text-2xl"
        style={{
          background: "linear-gradient(180deg,#7CE6BE,#3DA579)",
          color: "#052016",
          boxShadow: "0 14px 40px rgba(109,208,169,0.55)",
        }}
      >
        O
      </div>
      <h1 className="mt-6 text-4xl font-black tracking-tight leading-tight">
        Claim your<br /><span className="glow-own" style={{ color: "#6DD0A9" }}>turf.</span>
      </h1>
      <p className="text-white/60 mt-2">Sign in to start owning streets.</p>

      <form onSubmit={magic} className="mt-8 space-y-3">
        <input
          className="input"
          type="email"
          required
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" disabled={busy} className="btn w-full">
          {sent ? "Check your inbox ✓" : busy ? "Sending…" : "Email me a link"}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5 text-white/40 text-xs">
        <div className="h-px flex-1 bg-white/10" /> OR <div className="h-px flex-1 bg-white/10" />
      </div>
      <button onClick={google} className="btn btn-ghost w-full">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.6 6.3 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z" /><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 16 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.6 6.3 29 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" /><path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13-5l-6-5.1C28.9 35.5 26.6 36 24 36c-5.3 0-9.7-2.6-11.3-7l-6.6 5.1C9.6 39.6 16.3 44 24 44z" /><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4-4 5.4l6 5.1c-.4.4 6.7-4.9 6.7-14.5 0-1.2-.1-2.3-.4-3.5z" /></svg>
        Continue with Google
      </button>
    </div>
  );
}
