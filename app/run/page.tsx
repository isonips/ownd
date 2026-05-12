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
        pitch: 50,
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
          paint: { "line-color": "#76F4DF", "line-width": 14, "line-opacity": 0.2, "line-blur": 5 },
        });
        m.addLayer({
          id: "path",
          type: "line",
          source: "path",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#76F4DF", "line-width": 4 },
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
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,8,15,0.65) 0%, rgba(7,8,15,0) 22%, rgba(7,8,15,0) 50%, var(--bg) 100%)",
        }}
      />

      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div className="chip">
          {running ? <span className="pulse-dot" /> : <span className="w-2 h-2 rounded-full" style={{ background: "var(--ink-3)" }} />}
          <span>{running ? "Recording" : "Idle"}</span>
        </div>
        <div className="chip">GPS · live</div>
      </header>

      <div className="absolute left-0 right-0 bottom-0 z-10 px-4 pb-24">
        <div className="card-solid">
          <div className="eyebrow">Distance</div>
          <div className="num text-[56px] leading-none mt-1">
            {(distance / 1000).toFixed(2)}
            <span className="text-lg ml-2 font-medium" style={{ color: "var(--ink-3)" }}>km</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-5">
            <div>
              <div className="eyebrow">Time</div>
              <div className="num text-[28px] mt-1">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
              </div>
            </div>
            <div>
              <div className="eyebrow">Pace</div>
              <div className="num text-[28px] mt-1">
                {paceStr}<span className="text-sm ml-1 font-medium" style={{ color: "var(--ink-3)" }}>/km</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3">
          {!running ? (
            <button className="btn w-full" onClick={start} disabled={busy}>
              {busy ? "Uploading…" : "Start run"}
            </button>
          ) : (
            <button className="btn btn-danger w-full" onClick={stop}>Stop & claim</button>
          )}
        </div>

        {result && (
          <div className="card mt-3">
            <div className="eyebrow">Run complete</div>
            <div className="flex items-center justify-between mt-2">
              <div>
                <div className="num text-2xl" style={{ color: "var(--mint)" }}>+{result.claimed}</div>
                <div className="eyebrow mt-0.5">Claimed</div>
              </div>
              <div className="divider w-px h-10 self-center" />
              <div>
                <div className="num text-2xl" style={{ color: "var(--amber)" }}>{result.stolen}</div>
                <div className="eyebrow mt-0.5">Stolen</div>
              </div>
              <div className="divider w-px h-10 self-center" />
              <div>
                <div className="num text-2xl">{(distance / 1000).toFixed(2)}</div>
                <div className="eyebrow mt-0.5">km</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
