// Supabase Edge Function: process-run
// Processes an uploaded run, claims/contests street segments via Overpass.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RunPayload {
  coordinates: [number, number][]; // [lng, lat]
  distance_m: number;
  duration_s: number;
}

async function fetchOverpassWays(coords: [number, number][]): Promise<any[]> {
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  const south = Math.min(...lats) - 0.0005;
  const north = Math.max(...lats) + 0.0005;
  const west = Math.min(...lngs) - 0.0005;
  const east = Math.max(...lngs) + 0.0005;
  const query = `[out:json][timeout:25];
    way["highway"](${south},${west},${north},${east});
    (._;>;);
    out body;`;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: "data=" + encodeURIComponent(query),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.elements || [];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    const { data: userRes } = await supabase.auth.getUser(token);
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: cors });

    const payload: RunPayload = await req.json();
    if (!payload.coordinates || payload.coordinates.length < 2) {
      return new Response(JSON.stringify({ error: "invalid run" }), { status: 400, headers: cors });
    }

    // Boost active?
    const { data: boost } = await supabase
      .from("power_ups")
      .select("id")
      .eq("user_id", user.id)
      .eq("type", "boost")
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();
    const runnerBonus = boost ? 10 : 0;

    // Insert run, then update geometry via RPC.
    const wkt = `LINESTRING(${payload.coordinates.map(([x, y]) => `${x} ${y}`).join(",")})`;
    const { data: inserted, error: insErr } = await supabase
      .from("runs")
      .insert({
        user_id: user.id,
        distance_m: payload.distance_m,
        duration_s: payload.duration_s,
      })
      .select("id")
      .single();
    if (insErr || !inserted) {
      return new Response(JSON.stringify({ error: insErr?.message ?? "run insert" }), { status: 500, headers: cors });
    }
    // Update geometry via SQL
    await supabase.rpc("set_run_geom", { run_id: inserted.id, wkt }).catch(() => {});

    // Overpass
    const elements = await fetchOverpassWays(payload.coordinates);
    const nodes = new Map<number, [number, number]>();
    for (const el of elements) if (el.type === "node") nodes.set(el.id, [el.lon, el.lat]);

    const claimed: any[] = [];
    const stolen: any[] = [];

    for (const el of elements) {
      if (el.type !== "way") continue;
      const coords: [number, number][] = (el.nodes || [])
        .map((n: number) => nodes.get(n))
        .filter(Boolean) as [number, number][];
      if (coords.length < 2) continue;

      const segWkt = `LINESTRING(${coords.map(([x, y]) => `${x} ${y}`).join(",")})`;

      // Upsert segment
      const { data: seg } = await supabase
        .from("street_segments")
        .upsert(
          { osm_way_id: el.id, name: el.tags?.name ?? null },
          { onConflict: "osm_way_id" },
        )
        .select("id")
        .single();
      if (!seg) continue;
      await supabase.rpc("set_segment_geom", { seg_id: seg.id, wkt: segWkt }).catch(() => {});

      // Intersect: assume Overpass bbox returned overlapping ways; we accept all for MVP
      // Lookup territory
      const { data: terr } = await supabase
        .from("territory")
        .select("*")
        .eq("segment_id", seg.id)
        .maybeSingle();

      if (!terr) {
        const { data: newTerr } = await supabase
          .from("territory")
          .insert({
            segment_id: seg.id,
            owner_id: user.id,
            score: 50 + runnerBonus,
          })
          .select("*")
          .single();
        if (newTerr) claimed.push({ segment_id: seg.id, name: el.tags?.name });
      } else if (terr.owner_id === user.id) {
        const newScore = Math.min(100, terr.score + 10);
        await supabase
          .from("territory")
          .update({ score: newScore, last_defended_at: new Date().toISOString() })
          .eq("id", terr.id);
      } else {
        // shield on owner?
        const { data: shield } = await supabase
          .from("power_ups")
          .select("id")
          .eq("user_id", terr.owner_id)
          .eq("type", "shield")
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .limit(1)
          .maybeSingle();
        if (shield) continue;

        const newScore = terr.score - 15 + runnerBonus;
        if (newScore <= 0) {
          await supabase
            .from("territory")
            .update({
              owner_id: user.id,
              score: 50 + runnerBonus,
              claimed_at: new Date().toISOString(),
              last_defended_at: new Date().toISOString(),
            })
            .eq("id", terr.id);
          stolen.push({
            segment_id: seg.id,
            name: el.tags?.name,
            previous_owner: terr.owner_id,
          });
        } else {
          await supabase.from("territory").update({ score: newScore }).eq("id", terr.id);
        }
      }
    }

    // Points
    await supabase.rpc("bump_points", { uid: user.id, delta: claimed.length * 5 + stolen.length * 15 }).catch(() => {});

    // Mark boost used
    if (boost) await supabase.from("power_ups").update({ used_at: new Date().toISOString() }).eq("id", boost.id);

    return new Response(
      JSON.stringify({ run_id: inserted.id, claimed, stolen }),
      { headers: { ...cors, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
