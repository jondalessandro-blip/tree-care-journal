export const CLIMATES = [
  { value: "hardy_outdoor", label: "Hardy / Outdoor", hint: "requires dormancy", emoji: "❄️" },
  { value: "cold_hardy_conifer", label: "Cold Hardy Conifer", hint: "pines / junipers", emoji: "🌲" },
  { value: "tropical", label: "Tropical & Subtropical", hint: "indoor, no frost", emoji: "🌴" },
] as const;

export type ClimateValue = (typeof CLIMATES)[number]["value"];

export const FOLIAGES = [
  { value: "deciduous", label: "Deciduous", hint: "sheds annually" },
  { value: "conifer", label: "Conifer", hint: "needles / scales" },
  { value: "broadleaf_evergreen", label: "Broadleaf Evergreen", hint: "year-round" },
  { value: "succulent", label: "Succulent / Desert", hint: "Jade / Portulacaria" },
] as const;

export type FoliageValue = (typeof FOLIAGES)[number]["value"];

export const STYLES = [
  "Chokkan",
  "Moyogi",
  "Shakan",
  "Kengai",
  "Han-Kengai",
  "Hokidachi",
  "Yose-ue",
  "Bunjin",
  "Bonchi",
  "Production",
] as const;

export type StyleValue = (typeof STYLES)[number];

export const TAGS = [
  { value: "flowering", label: "Flowering", bg: "#EAD1DC", fg: "#5c2740" },
  { value: "fruit_berry", label: "Fruit/Berry", bg: "#F4CCCC", fg: "#6b1f1f" },
  { value: "acid_lover", label: "Acid Lover", hint: "kanuma + rainwater", bg: "#D9D2E9", fg: "#3d2a5c" },
  { value: "alkaline_lover", label: "Alkaline Lover", hint: "lime chip", bg: "#FCE5CD", fg: "#6b451c" },
  { value: "cascade_candidate", label: "Cascade Candidate", bg: "#CFE2F3", fg: "#1e3a5c" },
  { value: "yamadori", label: "Yamadori/Collected", bg: "#C9A66B", fg: "#3d2914" },
] as const;

export type TagValue = (typeof TAGS)[number]["value"];

export function climateLabel(v: string | null | undefined) {
  return CLIMATES.find((c) => c.value === v)?.label ?? null;
}
export function foliageLabel(v: string | null | undefined) {
  return FOLIAGES.find((c) => c.value === v)?.label ?? null;
}
export function tagMeta(v: string) {
  return TAGS.find((t) => t.value === v);
}
