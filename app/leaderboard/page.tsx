import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import Paywall from "@/components/Paywall";

export const dynamic = "force-dynamic";

export default async function Leaderboard() {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: viewer } = user
    ? await supabase.from("profiles").select("is_premium").eq("id", user.id).maybeSingle()
    : { data: null };

  if (!user || !viewer?.is_premium) {
    return (
      <div className="px-5 pt-6">
        <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Leaderboard</div>
        <h1 className="text-3xl font-black tracking-tight">Top owners</h1>
        <Paywall message="Premium required to view the global leaderboard." />
      </div>
    );
  }

  const { data: rows } = await supabase
    .from("territory")
    .select("owner_id, profiles!territory_owner_id_fkey(username, points)")
    .not("owner_id", "is", null);

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

  const medal = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;

  return (
    <div className="px-5 pt-6">
      <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Leaderboard</div>
      <h1 className="text-3xl font-black tracking-tight">Top owners</h1>

      <ol className="mt-5 space-y-2">
        {ranked.map((r, i) => (
          <li key={r.id} className="card !p-3 flex items-center gap-3">
            <div className="w-9 h-9 grid place-items-center rounded-xl bg-white/5 font-black">
              {medal(i) ?? <span className="text-white/70">{i + 1}</span>}
            </div>
            <Link href={`/profile/${r.username}`} className="flex-1">
              <div className="font-bold">@{r.username}</div>
              <div className="text-xs text-white/55">{r.points} pts</div>
            </Link>
            <div className="text-right">
              <div className="stat-num text-xl" style={{ color: "#6DD0A9" }}>{r.count}</div>
              <div className="text-[10px] uppercase tracking-widest text-white/55 font-bold">streets</div>
            </div>
          </li>
        ))}
        {ranked.length === 0 && (
          <div className="card text-white/60 text-center">No owners yet — go run.</div>
        )}
      </ol>
    </div>
  );
}
