import { supabaseServer } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/auth";
import Paywall from "@/components/Paywall";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: { username: string } }) {
  const user = await safeGetUser();
  const supabase = supabaseServer();

  let profile: any = null;
  let viewer: any = null;
  let territoryCount = 0;
  try {
    const r1 = await supabase
      .from("profiles")
      .select("*")
      .eq("username", params.username)
      .maybeSingle();
    profile = r1.data;
    if (user) {
      const r2 = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      viewer = r2.data;
    }
    if (profile) {
      const r3 = await supabase
        .from("territory")
        .select("*", { count: "exact", head: true })
        .eq("owner_id", profile.id);
      territoryCount = r3.count ?? 0;
    }
  } catch {
    // ignore — fall through to notFound if profile is null
  }
  if (!profile) notFound();

  const isSelf = user?.id === profile.id;
  const premiumOK = isSelf || viewer?.is_premium;

  return (
    <div className="px-5 pt-6">
      <div className="flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-3xl grid place-items-center text-3xl font-black"
          style={{
            background: "linear-gradient(180deg,#7CE6BE,#3DA579)",
            color: "#052016",
            boxShadow: "0 14px 40px rgba(109,208,169,0.45)",
          }}
        >
          {profile.username?.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">@{profile.username}</h1>
          <div className="text-white/60 text-sm">
            {profile.is_premium ? <span className="text-own font-bold">Premium</span> : "Free"} · {profile.points} pts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="card">
          <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Streets</div>
          <div className="stat-num text-4xl mt-1" style={{ color: "#6DD0A9" }}>{territoryCount ?? 0}</div>
        </div>
        <div className="card">
          <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Points</div>
          <div className="stat-num text-4xl mt-1">{profile.points}</div>
        </div>
      </div>

      <h2 className="mt-7 text-lg font-black tracking-tight">Run history</h2>
      {premiumOK ? <PremiumStats userId={profile.id} /> : <Paywall message="Premium required to view full history & streaks." />}
    </div>
  );
}

async function PremiumStats({ userId }: { userId: string }) {
  const supabase = supabaseServer();
  let runs: any[] | null = null;
  try {
    const r = await supabase
      .from("runs")
      .select("id, distance_m, duration_s, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    runs = r.data;
  } catch {
    runs = null;
  }

  if (!runs || runs.length === 0)
    return <div className="text-white/60 mt-3">No runs yet.</div>;

  return (
    <ul className="mt-3 space-y-2">
      {runs.map((r) => (
        <li key={r.id} className="card !p-3 flex items-center justify-between">
          <div>
            <div className="font-bold">{(r.distance_m / 1000).toFixed(2)} km</div>
            <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold mt-0.5">
              {new Date(r.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="text-white/80 font-bold">
            {Math.floor(r.duration_s / 60)}:{String(r.duration_s % 60).padStart(2, "0")}
          </div>
        </li>
      ))}
    </ul>
  );
}
