// Compute the next care date given a base date, frequency, and excluded months.
// Behavior for excluded months: PUSH FORWARD — if the computed date lands in an
// excluded month, roll to the first day of the next allowed month.

export type Frequency = "weekly" | "monthly" | "annually";

export function addFrequency(date: Date, freq: Frequency): Date {
  const d = new Date(date.getTime());
  if (freq === "weekly") d.setDate(d.getDate() + 7);
  else if (freq === "monthly") d.setMonth(d.getMonth() + 1);
  else d.setFullYear(d.getFullYear() + 1);
  return d;
}

// excluded: array of month numbers 1-12
export function pushForwardIfExcluded(date: Date, excluded: number[]): Date {
  if (!excluded || excluded.length === 0) return date;
  const set = new Set(excluded);
  const d = new Date(date.getTime());
  let guard = 0;
  while (set.has(d.getMonth() + 1) && guard++ < 24) {
    d.setDate(1);
    d.setMonth(d.getMonth() + 1);
  }
  return d;
}

export function computeNextDate(
  baseISO: string,
  freq: Frequency,
  excluded: number[],
): string {
  const base = new Date(baseISO + "T00:00:00");
  const next = pushForwardIfExcluded(addFrequency(base, freq), excluded);
  return toISODate(next);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const CARE_LABELS: Record<"fertilize" | "prune" | "repot", string> = {
  fertilize: "Fertilize",
  prune: "Prune",
  repot: "Repot",
};

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
