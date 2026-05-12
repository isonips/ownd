import TerritoryMap from "@/components/TerritoryMap";
import { safeGetUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const user = await safeGetUser();

  // tiny legend cards
  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <TerritoryMap selfId={user?.id} />
      </div>
      {/* Top header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div>
          <div className="text-[11px] uppercase tracking-widest text-white/55 font-bold">Territory</div>
          <div className="text-2xl font-black tracking-tight">Live map</div>
        </div>
        <div className="chip">
          <span className="w-1.5 h-1.5 rounded-full bg-own" /> live
        </div>
      </div>

      {/* Legend */}
      <div className="absolute z-10 left-4 right-4 bottom-24">
        <div className="card !p-3 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-full" style={{ background: "#6DD0A9", boxShadow: "0 0 12px #6DD0A9" }} />
            <span>You</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-full" style={{ background: "#7aa3ff" }} />
            <span>Others</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded-full" style={{ background: "#F59E0B" }} />
            <span>Contested</span>
          </div>
        </div>
      </div>
    </div>
  );
}
