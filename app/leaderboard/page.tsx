import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { safeGetUser } from "@/lib/auth";
import Paywall from "@/components/Paywall";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const user = await safeGetUser();
  const supabase = supabaseServer();
  let viewer: any = null;
  if (user) {
    try {
      const r = await supabase
        .from("profiles")
        .select("is_premium")
        .eq("id", user.id)
        .maybeSingle();
      viewer = r.data;
    } catch {}
  }

  if (!user || !viewer?.is_premium) {
    return (
      <div className="px-5 pt-6">
        <div className="eyebrow">Leaderboard</div>
        <h1 className="h-display text-[28px] mt-1">Top owners</h1>
        <Paywall message="Premium required to view the global leaderboard." />
      </div>
    );
  }

  let rows: any[] | null = null;
  try {
    const r = await supabase
      .from("territory")
      .select("owner_id, profiles!territory_owner_id_fkey(username, points)")
      .not("owner_id", "is", null);
    rows = r.data;
  } catch {
    rows = null;
  }

  const counts = new Map<string, { username: string; points: number; count: number }>();
  for (const r of (rows ?? []) as any[]) {
    if (!r.owner_id || !r.profiles) continue;
    const k = r.owner_id;
    const cur = counts.get(k) ?? { username: r.profiles.username, points: r.profiles.points, count: 0 };
    cur.count++;
    counts.set(k, cur);
  }
  const ranked = [...counts.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);

  return (
    <div className="px-5 pt-6">
      <div className="eyebrow">Leaderboard</div>
      <h1 className="h-display text-[28px] mt-1">Top owners</h1>

      <ol className="mt-5 space-y-2">
        {ranked.map((r, i) => {
          const top3 = i < 3;
          return (
            <li key={r.id} className="card !p-3 flex items-center gap-3">
              <div
                className="w-8 h-8 grid place-items-center rounded-lg num text-sm"
                style={{
                  background: top3 ? "rgba(118,244,223,0.10)" : "rgba(255,255,255,0.04)",
                  color: top3 ? "var(--mint)" : "var(--ink-2)",
                  border: "1px solid var(--hairline)",
                }}
              >
                {i + 1}
              </div>
              <Link href={`/profile/${r.username}`} className="flex-1 min-w-0">
                <div className="font-semibold text-[14px] truncate">@{r.username}</div>
                <div className="text-[12px]" style={{ color: "var(--ink-3)" }}>
                  {r.points} pts
                </div>
              </Link>
              <div className="text-right">
                <div className="num text-lg" style={{ color: "var(--mint)" }}>{r.count}</div>
                <div className="eyebrow text-[10px]">streets</div>
              </div>
            </li>
          );
        })}
        {ranked.length === 0 && (
          <div className="card text-center text-[14px]" style={{ color: "var(--ink-3)" }}>
            No owners yet.
          </div>
        )}
      </ol>
    </div>
  );
}
