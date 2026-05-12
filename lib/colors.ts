// Deterministic hue per user id.
export function ownerColor(ownerId: string | null | undefined, selfId?: string | null): string {
  if (!ownerId) return "#444";
  if (selfId && ownerId === selfId) return "#6DD0A9";
  let h = 0;
  for (let i = 0; i < ownerId.length; i++) h = (h * 31 + ownerId.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 70%, 55%)`;
}

export const CONTESTED = "#F59E0B";
export const OWN = "#6DD0A9";
