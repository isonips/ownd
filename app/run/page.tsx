"use client";
import { useEffect, useRef, useState } from "react";
import type * as MapboxGL from "mapbox-gl";
import { supabaseBrowser } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Coord = [number, number];

function haversine(a: Coord, b: Coord): number {
  const R = 6371000;
  const toR = (d: number) => (d * Math.PI) / 180;
  const dLat = toR(b[1] - a[1]);
  const dLng = toR(b[0] - a[0]);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toR(a[1])) * Math.cos(toR(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export default function RunPage() {
  const router = useRouter();
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxGL.Map | null>(null);
  const watchId = useRef<number | null>(null);
  const startedAt = useRef<number | null>(null);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [distance, setDistance] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ claimed: number; stolen: number } | null>(null);

  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;
    let map: MapboxGL.Map | null = null;
    let cancelled = false;
    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !mapDiv.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
      const m = new mapboxgl.Map({
        container: mapDiv.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [2.3522, 48.8566],
        zoom: 16,
        pitch: 55,
        bearing: 0,
        attributionControl: false,
      });
      map = m;
      mapRef.current = m;
      m.on("load", () => {
        m.addSource("path", {
          type: "geojson",
          data: { type: "Feature", geometry: { type: "LineString", coordinates: [] }, properties: {} },
        });
        m.addLayer({
          id: "path-glow",
          type: "line",
          source: "path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#6DD0A9", "line-width": 18, "line-opacity": 0.35, "line-blur": 6 },
        });
        m.addLayer({
          id: "path",
          type: "line",
          source: "path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#6DD0A9", "line-width": 6 },
        });
      });
    })();
    return () => {
      cancelled = true;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 500);
    return () => clearInterval(t);
  }, [running]);

  function start() {
    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }
    setCoords([]);
    setDistance(0);
    setElapsed(0);
    setResult(null);
    startedAt.current = Date.now();
    setRunning(true);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const c: Coord = [pos.coords.longitude, pos.coords.latitude];
        setCoords((prev) => {
          const next = [...prev, c];
          if (prev.length > 0) setDistance((d) => d + haversine(prev[prev.length - 1], c));
          const map = mapRef.current;
          if (map && map.isStyleLoaded()) {
            const src = map.getSource("path") as MapboxGL.GeoJSONSource | undefined;
            src?.setData({
              type: "Feature",
              geometry: { type: "LineString", coordinates: next },
              properties: {},
            } as any);
            map.easeTo({ center: c, duration: 400, zoom: 16.5 });
          }
          return next;
        });
      },
      (err) => console.warn(err),
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 },
    );
  }

  async function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current);
    setRunning(false);
    if (coords.length < 2) return;
    setBusy(true);
    const supabase = supabaseBrowser();
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) { router.push("/login"); return; }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-run`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          coordinates: coords,
          distance_m: Math.round(distance),
          duration_s: elapsed,
        }),
      },
    );
    const json = await res.json();
    setBusy(false);
    setResult({ claimed: json.claimed?.length ?? 0, stolen: json.stolen?.length ?? 0 });
  }

  const paceMinPerKm = distance > 0 && elapsed > 0 ? (elapsed / 60) / (distance / 1000) : 0;
  const paceStr = paceMinPerKm
    ? `${Math.floor(paceMinPerKm)}'${String(Math.round((paceMinPerKm % 1) * 60)).padStart(2, "0")}"`
    : "—";

  return (
    <div className="relative h-full">
      <div ref={mapDiv} className="absolute inset-0" />
      {/* gradient over map */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "linear-gradient(180deg, rgba(5,7,10,0.7) 0%, rgba(5,7,10,0) 25%, rgba(5,7,10,0) 55%, #05070a 100%)" }}
      />

      {/* Top status */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div className="chip">
          {running ? <span className="pulse-dot" /> : <span className="w-2 h-2 rounded-full bg-white/40" />}
          {running ? "Recording" : "Ready"}
        </div>
        <div className="chip">GPS · live</div>
      </div>

      {/* Big stats panel */}
      <div className="absolute left-0 right-0 bottom-0 z-10 px-4 pb-28">
        <div className="card !p-5">
          <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Distance</div>
          <div className="stat-num text-[64px] leading-none mt-1 glow-own" style={{ color: "#fff" }}>
            {(distance / 1000).toFixed(2)}
            <span className="text-2xl text-white/50 font-bold ml-2">km</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Time</div>
              <div className="stat-num text-3xl mt-1">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Pace</div>
              <div className="stat-num text-3xl mt-1">{paceStr}<span className="text-base text-white/50 ml-1">/km</span></div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {!running ? (
            <button className="btn w-full text-lg" onClick={start} disabled={busy}>
              {busy ? "Uploading…" : "Start run"}
            </button>
          ) : (
            <button className="btn btn-danger w-full text-lg" onClick={stop}>
              Stop & claim
            </button>
          )}
        </div>

        {result && (
          <div className="card mt-3 text-center">
            <div className="text-xs uppercase tracking-widest text-white/55 font-bold">Run uploaded</div>
            <div className="flex items-center justify-around mt-2">
              <div>
                <div className="stat-num text-3xl" style={{ color: "#6DD0A9" }}>+{result.claimed}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/60">Claimed</div>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <div className="stat-num text-3xl" style={{ color: "#F59E0B" }}>{result.stolen}</div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-white/60">Stolen</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
