import type { HemLevel } from "./silhouette";

// Category → default hem level + volume. Used at seed time, never at render.
// Render reads Item.drapeHem and Item.drapeVolume, which are stored per item.
export const CATEGORY_DRAPE: Record<string, { hem: HemLevel; volume: number }> = {
  DRESSES: { hem: "knee", volume: 1.15 },
  OUTERWEAR: { hem: "thigh", volume: 1.35 },
  TOPS: { hem: "hip", volume: 1.0 },
  BOTTOMS: { hem: "ankle", volume: 1.05 },
  KNITWEAR: { hem: "hip", volume: 1.1 },
  ACCESSORIES: { hem: "shoulder", volume: 0.6 },
};

export const HEM_OPTIONS: HemLevel[] = [
  "shoulder", "bust", "waist", "hip", "thigh", "knee", "calf", "ankle",
];

export function defaultDrape(category: string): { hem: HemLevel; volume: number } {
  return CATEGORY_DRAPE[category] ?? { hem: "waist", volume: 1.0 };
}
