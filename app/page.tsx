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
    try {
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
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative h-full">
      {/* Map background */}
      <div className="absolute inset-0 bottom-[44%]">
        <TerritoryMap selfId={user?.id} interactive={false} showHover={false} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(7,8,15,0.25) 0%, rgba(7,8,15,0) 25%, rgba(7,8,15,0.78) 72%, var(--bg) 100%)",
          }}
        />
      </div>

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-2">
          <Logo />
          <div className="font-bold tracking-tight text-[17px]">Ownd</div>
        </div>
        {me ? (
          <Link href={`/profile/${me.username}`} className="chip">
            <span className="num" style={{ color: "var(--mint)" }}>{me.points}</span>
            <span style={{ color: "var(--ink-3)" }}>pts</span>
          </Link>
        ) : (
          <Link href="/login" className="chip">Sign in</Link>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 px-5 mt-[34vh]">
        <div className="chip mb-4">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--mint)" }} />
          <span>Move to own · Beta</span>
        </div>
        <h1 className="h-display text-[40px]">
          Every street<br />
          <span className="gradient-text">you run is yours.</span>
        </h1>
        <p className="mt-3 text-[15px] leading-snug" style={{ color: "var(--ink-2)" }}>
          Run a block to claim it. Defend it. Earn points and on-chain power-ups while you move.
        </p>

        {me ? (
          <div className="grid grid-cols-3 gap-2 mt-6">
            <Stat label="Streets" value={String(myTerritory)} accent />
            <Stat label="Points" value={String(me.points)} />
            <Stat label="Tier" value={me.is_premium ? "Pro" : "Free"} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mt-6">
            <Feature title="Track" desc="GPS" />
            <Feature title="Claim" desc="Streets" />
            <Feature title="Defend" desc="Turf" />
          </div>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {user ? (
            <Link href="/run" className="btn w-full">Start a run</Link>
          ) : (
            <Link href="/login" className="btn w-full">Sign in to play</Link>
          )}
          <Link href="/map" className="btn btn-ghost w-full">Explore territory</Link>
        </div>
      </section>
    </div>
  );
}

function Logo() {
  return (
    <div
      className="w-8 h-8 rounded-[10px] grid place-items-center text-[13px] font-bold"
      style={{
        background: "linear-gradient(135deg, #76F4DF 0%, #2BCBA3 100%)",
        color: "#07120E",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35), 0 4px 14px rgba(43,203,163,0.25)",
      }}
    >
      O
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="card !p-3">
      <div className="eyebrow text-[10px]">{label}</div>
      <div className="num text-2xl mt-1" style={{ color: accent ? "var(--mint)" : "var(--ink)" }}>
        {value}
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="card !p-3">
      <div className="text-sm font-semibold">{title}</div>
      <div className="eyebrow text-[10px] mt-1">{desc}</div>
    </div>
  );
}
