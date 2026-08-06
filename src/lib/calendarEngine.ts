import zones from "@/data/zones.json";
import groups from "@/data/groups.json";

export type Zone = {
  id: string;
  last_frost: string;
  first_frost: string;
  shift_weeks: number;
};

export type Task = {
  id: string;
  title: string;
  category: string;
  base_month: number;
  zone_shift: boolean;
  trigger: string;
  desc: string;
  warning?: string;
  group_id?: string;
  group_label?: string;
};

export type Group = {
  group_id: string;
  label: string;
  examples: string;
  icon: string;
  tasks: Task[];
  species_notes?: any;
};

export type CalendarTask = Task & {
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
export const GROUPS = groups as unknown as Group[];

function shiftMonth(baseMonth: number, shiftWeeks: number): number {
  const shifted = baseMonth + shiftWeeks / 4.3;
  let m = Math.round(shifted);
  if (m < 1) m = 1;
  if (m > 12) m = 12;
  return m;
}

export function generateCalendar(
  zone: Zone,
  selectedGroups: Group[],
): CalendarMonth[] {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    monthName: new Date(0, i).toLocaleString("en", { month: "long" }),
    tasks: [] as CalendarTask[],
  }));

  selectedGroups.forEach((group) => {
    group.tasks.forEach((task) => {
      let targetMonth = task.base_month;
      if (task.zone_shift) {
        targetMonth = shiftMonth(task.base_month, zone.shift_weeks);
      } else {
        if (task.id === "t_out") {
          const [m] = zone.last_frost.split("-").map(Number);
          targetMonth = m;
          if (zone.shift_weeks < -6) targetMonth = m;
        }
        if (task.id === "t_in") {
          const [m] = zone.first_frost.split("-").map(Number);
          targetMonth = m - 1;
          if (targetMonth < 1) targetMonth = 9;
        }
      }
      const enriched: CalendarTask = {
        ...task,
        group_id: group.group_id,
        group_label: group.label,
        icon: group.icon,
        month: targetMonth,
      };
      months[targetMonth - 1].tasks.push(enriched);
    });
  });

  return months;
}
