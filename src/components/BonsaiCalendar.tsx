import { useState } from "react";
import {
  GROUPS,
  ZONES,
  generateCalendar,
  type CalendarMonth,
  type CalendarTask,
} from "@/lib/calendarEngine";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const GROUP_BG: Record<string, string> = {
  hardy_deciduous: "#E8F5E9",
  conifer_two_flush: "#E3F2FD",
  conifer_one_flush: "#E0F2F1",
  tropical: "#FFF8E1",
};

function TaskItem({ task }: { task: CalendarTask }) {
  return (
    <li
      className="rounded-lg p-4"
      style={{ backgroundColor: GROUP_BG[task.group_id] ?? "#F5F5F5" }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="text-lg">
          {task.icon}
        </span>
        <h4 className="font-medium text-foreground">{task.title}</h4>
        <Badge variant="secondary" className="capitalize">
          {task.category}
        </Badge>
      </div>
      {task.trigger && (
        <p className="mt-1 text-xs italic text-muted-foreground">
          {task.trigger}
        </p>
      )}
      <p className="mt-2 text-sm text-foreground/80">{task.desc}</p>
      {task.warning && (
        <p className="mt-2 text-sm font-medium text-red-600">{task.warning}</p>
      )}
    </li>
  );
}

function MonthCard({ month }: { month: CalendarMonth }) {
  const byGroup = new Map<string, CalendarTask[]>();
  for (const task of month.tasks) {
    const list = byGroup.get(task.group_id) ?? [];
    list.push(task);
    byGroup.set(task.group_id, list);
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-2xl">{month.monthName}</h3>
      {month.tasks.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing scheduled — just watch and water.
        </p>
      ) : (
        <div className="mt-4 flex flex-col gap-5">
          {[...byGroup.entries()].map(([groupId, tasks]) => (
            <div key={groupId}>
              <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                {tasks[0]?.group_label}
              </p>
              <ul className="flex flex-col gap-3">
                {tasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function BonsaiCalendar() {
  const [zoneId, setZoneId] = useState("5b");
  const [groupIds, setGroupIds] = useState<string[]>(["hardy_deciduous"]);
  const [calendar, setCalendar] = useState<CalendarMonth[] | null>(null);

  const toggleGroup = (id: string) =>
    setGroupIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="font-display text-xl">Step 1 — Your hardiness zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Timings shift with your frost dates.
          </p>
          <Select value={zoneId} onValueChange={setZoneId}>
            <SelectTrigger className="mt-3 bg-background md:max-w-sm">
              <SelectValue placeholder="Select a zone" />
            </SelectTrigger>
            <SelectContent>
              {ZONES.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.display}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h2 className="font-display text-xl">Step 2 — What do you grow?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick every group in your collection.
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            {GROUPS.map((group) => (
              <li key={group.group_id} className="flex items-start gap-3">
                <Checkbox
                  id={`group-${group.group_id}`}
                  checked={groupIds.includes(group.group_id)}
                  onCheckedChange={() => toggleGroup(group.group_id)}
                  className="mt-1"
                />
                <label
                  htmlFor={`group-${group.group_id}`}
                  className="cursor-pointer"
                >
                  <span className="font-medium">
                    <span aria-hidden="true">{group.icon}</span> {group.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    e.g. {group.examples}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <Button
          size="lg"
          disabled={groupIds.length === 0}
          onClick={() => setCalendar(generateCalendar(zoneId, groupIds))}
        >
          Generate My Calendar
        </Button>
      </div>

      {calendar && (
        <div className="flex flex-col gap-4">
          {calendar.map((month) => (
            <MonthCard key={month.month} month={month} />
          ))}
        </div>
      )}
    </div>
  );
}

export default BonsaiCalendar;
