import { soilLibrary, defaultSoilByTree } from "@/data/soilLibrary";
import { CLIMATES, FOLIAGES, TAGS } from "@/lib/taxonomy";

export { soilLibrary };

export type SoilMix = (typeof soilLibrary)[number];

export function getSoil(id: string | null | undefined): SoilMix | null {
  if (!id) return null;
  return soilLibrary.find((s) => s.id === id) ?? null;
}

// Adapt stored enum-ish values to the human labels the library expects.
export function computeDefaultSoil(tree: {
  climate?: string | null;
  foliage?: string | null;
  tags?: string[] | null;
}): string {
  const climateLabel =
    CLIMATES.find((c) => c.value === tree.climate)?.label ?? "";
  const foliageLabel =
    FOLIAGES.find((f) => f.value === tree.foliage)?.label ?? "";
  const tagLabels = (tree.tags ?? [])
    .map((t) => TAGS.find((tg) => tg.value === t)?.label)
    .filter(Boolean) as string[];
  return defaultSoilByTree({
    climate: climateLabel,
    foliage: foliageLabel,
    tags: tagLabels,
  });
}

export const WINTER_LOCATIONS = [
  { value: "garage", label: "Garage", hint: "0–5 °C" },
  { value: "cool_indoor", label: "Cool Indoor", hint: "10–15 °C" },
  { value: "warm_indoor", label: "Warm Indoor", hint: "18 °C + light" },
] as const;

export function winterLocationLabel(v: string | null | undefined) {
  const m = WINTER_LOCATIONS.find((w) => w.value === v);
  return m ? `${m.label} (${m.hint})` : null;
}

// Convert 0–1 ratio into an rgb color from red → green → blue for pH slider.
export function phGradientCss() {
  return "linear-gradient(to right, #dc2626 0%, #16a34a 50%, #2563eb 100%)";
}
