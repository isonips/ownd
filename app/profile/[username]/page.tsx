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
          className="w-16 h-16 rounded-2xl grid place-items-center text-2xl font-semibold"
          style={{
            background: "linear-gradient(135deg, #76F4DF 0%, #2BCBA3 100%)",
            color: "#07120E",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)",
          }}
        >
          {profile.username?.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight truncate">@{profile.username}</h1>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--ink-3)" }}>
            {profile.is_premium ? (
              <span style={{ color: "var(--mint)" }}>Premium</span>
            ) : (
              "Free"
            )}{" "}
            · {profile.points} pts
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <div className="card">
          <div className="eyebrow">Streets owned</div>
          <div className="num text-[34px] mt-1" style={{ color: "var(--mint)" }}>{territoryCount}</div>
        </div>
        <div className="card">
          <div className="eyebrow">Points</div>
          <div className="num text-[34px] mt-1">{profile.points}</div>
        </div>
      </div>

      <h2 className="mt-8 text-[15px] font-semibold tracking-tight">Run history</h2>
      {premiumOK ? (
        <PremiumStats userId={profile.id} />
      ) : (
        <Paywall message="Unlock full run history, streaks and detailed analytics." />
      )}
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
    return (
      <div className="card mt-3 text-center text-[14px]" style={{ color: "var(--ink-3)" }}>
        No runs yet.
      </div>
    );

  return (
    <ul className="mt-3 space-y-2">
      {runs.map((r) => (
        <li key={r.id} className="card !p-3 flex items-center justify-between">
          <div>
            <div className="num text-[15px]">{(r.distance_m / 1000).toFixed(2)} km</div>
            <div className="eyebrow mt-1">
              {new Date(r.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className="num text-[15px]" style={{ color: "var(--ink-2)" }}>
            {Math.floor(r.duration_s / 60)}:{String(r.duration_s % 60).padStart(2, "0")}
          </div>
        </li>
      ))}
    </ul>
  );
}
