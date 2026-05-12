import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = supabaseServer();
  const { data, error } = await supabase.rpc("territory_geojson");
  if (error) return NextResponse.json({ type: "FeatureCollection", features: [] });
  return NextResponse.json(data ?? { type: "FeatureCollection", features: [] });
}
