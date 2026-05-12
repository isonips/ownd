import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = supabaseServer();
    const { data, error } = await supabase.rpc("territory_geojson");
    if (error || !data) {
      return NextResponse.json({ type: "FeatureCollection", features: [] });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ type: "FeatureCollection", features: [] });
  }
}
