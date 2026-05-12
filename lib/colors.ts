const PALETTE = ["#4CC9F0", "#8B5CF6", "#EC4899", "#F59E0B", "#34D399", "#F472B6"];

export function ownerColor(ownerId: string | null | undefined, selfId?: string | null): string {
  if (!ownerId) return "#3A3F47";
  if (selfId && ownerId === selfId) return "#76F4DF";
  let h = 0;
  for (let i = 0; i < ownerId.length; i++) h = (h * 31 + ownerId.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export const CONTESTED = "#F59E0B";
export const OWN = "#76F4DF";
