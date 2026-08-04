import zones from "@/data/zones.json";
import groups from "@/data/groups.json";

export type Zone = {
  id: string;
  label: string;
  display: string;
  last_frost: string;
  first_frost: string;
  shift_weeks: number;
};

export type GroupTask = {
  id: string;
  title: string;
  category: string;
  base_month: number;
  zone_shift: boolean;
  trigger: string;
  desc: string;
  warning?: string;
};

export type Group = {
  group_id: string;
  label: string;
  examples: string;
  description: string;
  icon: string;
  tasks: GroupTask[];
  species_notes?: Record<string, string>;
};

export type CalendarTask = GroupTask & {
  group_id: string;
  group_label: string;
  icon: string;
  month: number;
};

export type CalendarMonth = {
  month: number;
  monthName: string;
  tasks: CalendarTask[];
};

export const ZONES = zones as Zone[];
export const GROUPS = groups as Group[];

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Shift a base month by a zone's week offset (later in cold zones, earlier in warm). */
function shiftMonth(baseMonth: number, shiftWeeks: number): number {
  const shiftedIndex = Math.round((baseMonth - 1) * 4.345 + shiftWeeks) / 4.345;
  let month = Math.round(shiftedIndex) + 1;
  while (month < 1) month += 12;
  while (month > 12) month -= 12;
  return month;
}

export function generateCalendar(
  zoneId: string,
  selectedGroupIds: string[],
): CalendarMonth[] {
  const zone = ZONES.find((z) => z.id === zoneId) ?? ZONES[0];
  const months: CalendarMonth[] = MONTH_NAMES.map((monthName, index) => ({
    month: index + 1,
    monthName,
    tasks: [],
  }));

  for (const group of GROUPS) {
    if (!selectedGroupIds.includes(group.group_id)) continue;
    for (const task of group.tasks) {
      const month = task.zone_shift
        ? shiftMonth(task.base_month, zone.shift_weeks)
        : task.base_month;
      const bucket = months[month - 1];
      if (!bucket) continue;
      bucket.tasks.push({
        ...task,
        group_id: group.group_id,
        group_label: group.label,
        icon: group.icon,
        month,
      });
    }
  }

  return months;
}
