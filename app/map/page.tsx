import TerritoryMap from "@/components/TerritoryMap";
import { safeGetUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MapPage() {
  const user = await safeGetUser();
  return (
    <div className="relative h-full">
      <div className="absolute inset-0">
        <TerritoryMap selfId={user?.id} />
      </div>
      <header className="relative z-10 flex items-center justify-between px-5 pt-6">
        <div>
          <div className="eyebrow">Territory</div>
          <div className="text-xl font-bold tracking-tight">Live map</div>
        </div>
        <div className="chip">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--mint)" }} />
          <span>live</span>
        </div>
      </header>

      <div className="absolute z-10 left-4 right-4 bottom-24">
        <div className="card !p-3 flex items-center justify-between text-[12px]" style={{ color: "var(--ink-2)" }}>
          <Legend swatch="#76F4DF" label="You" />
          <Legend swatch="#4CC9F0" label="Others" />
          <Legend swatch="#F59E0B" label="Contested" />
        </div>
      </div>
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-3 h-[3px] rounded-full" style={{ background: swatch }} />
      <span>{label}</span>
    </div>
  );
}
