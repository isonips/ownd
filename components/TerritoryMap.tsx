"use client";
import { useEffect, useRef, useState } from "react";
import type * as MapboxGL from "mapbox-gl";
import { ownerColor, CONTESTED } from "@/lib/colors";
import type { TerritoryFC } from "@/lib/types";

type Props = {
  selfId?: string | null;
  showHover?: boolean;
  interactive?: boolean;
};

export default function TerritoryMap({ selfId, showHover = true, interactive = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxGL.Map | null>(null);
  const [hover, setHover] = useState<{ name: string | null; owner: string | null; score: number } | null>(null);
  const [data, setData] = useState<TerritoryFC | null>(null);

  useEffect(() => {
    fetch("/api/territory").then((r) => r.json()).then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    let map: MapboxGL.Map | null = null;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !ref.current) return;
      mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
      const m = new mapboxgl.Map({
        container: ref.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [2.3522, 48.8566],
        zoom: 14.2,
        pitch: 45,
        bearing: -8,
        interactive,
        attributionControl: false,
      });
      map = m;
      mapRef.current = m;

      m.on("load", () => {
        m.addSource("territory", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        m.addLayer({
          id: "territory-glow",
          type: "line",
          source: "territory",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-width": 9,
            "line-color": ["get", "color"],
            "line-opacity": 0.22,
            "line-blur": 4,
          },
        });
        m.addLayer({
          id: "territory-line",
          type: "line",
          source: "territory",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-width": 3.5,
            "line-color": ["get", "color"],
            "line-opacity": 0.9,
          },
        });

        if (showHover) {
          m.on("mousemove", "territory-line", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            m.getCanvas().style.cursor = "pointer";
            setHover({
              name: (f.properties as any).name,
              owner: (f.properties as any).owner_username,
              score: (f.properties as any).score,
            });
          });
          m.on("mouseleave", "territory-line", () => {
            m.getCanvas().style.cursor = "";
            setHover(null);
          });
          m.on("click", "territory-line", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            setHover({
              name: (f.properties as any).name,
              owner: (f.properties as any).owner_username,
              score: (f.properties as any).score,
            });
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [interactive, showHover]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data) return;
    const stamped = {
      ...data,
      features: data.features.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          color:
            f.properties.score < 25
              ? CONTESTED
              : ownerColor(f.properties.owner_id, selfId ?? undefined),
        },
      })),
    };
    const apply = () => {
      const src = map.getSource("territory") as MapboxGL.GeoJSONSource | undefined;
      if (src) src.setData(stamped as any);
    };
    if (map.isStyleLoaded()) apply();
    else map.once("load", apply);
  }, [data, selfId]);

  return (
    <div className="relative w-full h-full">
      <div ref={ref} className="absolute inset-0" />
      {hover && (
        <div className="absolute top-20 left-4 right-4 card !p-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[14px] font-semibold truncate">
              {hover.name ?? "Unnamed street"}
            </div>
            <div className="chip num">{hover.score}</div>
          </div>
          <div className="text-[12px] mt-1" style={{ color: "var(--ink-3)" }}>
            {hover.owner ? `Owned by @${hover.owner}` : "Unclaimed"}
          </div>
        </div>
      )}
    </div>
  );
}
