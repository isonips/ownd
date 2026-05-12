import Link from "next/link";
import TerritoryMap from "@/components/TerritoryMap";
import { supabaseServer } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const user = await safeGetUser();
  const supabase = supabaseServer();

  let me: { username: string | null; points: number; is_premium: boolean } | null = null;
  let myTerritory = 0;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("username, points, is_premium")
      .eq("id", user.id)
      .maybeSingle();
    me = data;
    const { count } = await supabase
      .from("territory")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", user.id);
    myTerritory = count ?? 0;
  }

  return (
    <div className="relative h-full">
      {/* Map background */}
      <div className="absolute inset-0 bottom-[42%]">
        <TerritoryMap selfId={user?.id} interactive={false} showHover={false} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,7,10,0.3) 0%, rgba(5,7,10,0) 30%, rgba(5,7,10,0.85) 75%, #05070a 100%)",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-2xl grid place-items-center font-black"
            style={{
              background: "linear-gradient(180deg,#7CE6BE,#3DA579)",
              color: "#052016",
              boxShadow: "0 8px 24px rgba(109,208,169,0.45)",
            }}
          >
            O
          </div>
          <div className="font-black text-xl tracking-tight">Ownd</div>
        </div>
        {me ? (
          <Link href={`/profile/${me.username}`} className="chip">
            <span className="w-2 h-2 rounded-full bg-own" /> {me.points} pts
          </Link>
        ) : (
          <Link href="/login" className="chip">Sign in</Link>
        )}
      </div>

      {/* Hero copy */}
      <div className="relative z-10 px-5 mt-[36vh]">
        <div className="chip mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-own" /> Live territory
        </div>
        <h1 className="text-[44px] leading-[0.95] font-black tracking-tight">
          Run it.<br />
          <span className="glow-own" style={{ color: "#6DD0A9" }}>Own it.</span>
        </h1>
        <p className="mt-3 text-white/70 text-[15px] leading-snug">
          Every street you run becomes yours. Defend your turf — or steal someone else's by running it faster.
        </p>

        {/* Cards */}
        {me ? (
          <div className="grid grid-cols-3 gap-2 mt-5">
            <div className="card !p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-white/55 font-bold">Streets</div>
              <div className="stat-num text-2xl mt-1">{myTerritory}</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-white/55 font-bold">Points</div>
              <div className="stat-num text-2xl mt-1">{me.points}</div>
            </div>
            <div className="card !p-3 text-center">
              <div className="text-[10px] uppercase tracking-wide text-white/55 font-bold">Tier</div>
              <div className="stat-num text-2xl mt-1" style={{ color: me.is_premium ? "#6DD0A9" : "#fff" }}>
                {me.is_premium ? "Pro" : "Free"}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { emoji: "🏃", t: "Track" },
              { emoji: "🏁", t: "Claim" },
              { emoji: "🛡️", t: "Defend" },
            ].map((c) => (
              <div key={c.t} className="card !p-3 text-center">
                <div className="text-2xl">{c.emoji}</div>
                <div className="text-[11px] mt-1 font-bold uppercase tracking-wider text-white/70">{c.t}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {user ? (
            <Link href="/run" className="btn w-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#052016" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="13" cy="4.5" r="2" />
                <path d="M5 20l3-5 4-2-2-4 4 1 2 3 3-1" />
              </svg>
              Start a run
            </Link>
          ) : (
            <Link href="/login" className="btn w-full">Sign in to play</Link>
          )}
          <Link href="/map" className="btn btn-ghost w-full">Explore territory</Link>
        </div>
      </div>
    </div>
  );
}
