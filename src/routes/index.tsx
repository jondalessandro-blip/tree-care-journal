import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SoilSection } from "@/components/SoilSection";
import { computeDefaultSoil } from "@/lib/soil";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SignedImg } from "@/components/SignedImg";
import { TagChip, TagPicker } from "@/components/TagChip";
import {
  CLIMATES,
  FOLIAGES,
  STYLES,
  TAGS,
  climateLabel,
  foliageLabel,
} from "@/lib/taxonomy";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { formatDate, daysUntil, todayISO } from "@/lib/care";
import { uploadPhoto } from "@/lib/storage";
import { Plus, Leaf, Scissors, FlowerIcon, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Tree = {
  id: string;
  name: string;
  species: string | null;
  acquired_on: string | null;
  notes: string | null;
  cover_photo_url: string | null;
  climate: string | null;
  foliage: string | null;
  style: string | null;
  tags: string[] | null;
  next_fert_date: string | null;
  next_prune_date: string | null;
  next_repot_date: string | null;
};

async function fetchTrees(): Promise<Tree[]> {
  const { data, error } = await supabase
    .from("trees")
    .select(
      "id, name, species, acquired_on, notes, cover_photo_url, climate, foliage, style, tags, next_fert_date, next_prune_date, next_repot_date",
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tree[];
}

function Index() {
  const { data: trees = [], isLoading } = useQuery({
    queryKey: ["trees"],
    queryFn: fetchTrees,
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [climateFilter, setClimateFilter] = useState<string>("all");
  const [foliageFilter, setFoliageFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  const filtered = trees.filter((t) => {
    if (query.trim()) {
      const hay = [t.name, t.species]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(query.toLowerCase().trim())) return false;
    }
    if (climateFilter !== "all" && t.climate !== climateFilter) return false;
    if (foliageFilter !== "all" && t.foliage !== foliageFilter) return false;
    if (tagFilter !== "all" && !(t.tags ?? []).includes(tagFilter))
      return false;
    return true;
  });

  const hasActiveFilters =
    climateFilter !== "all" ||
    foliageFilter !== "all" ||
    tagFilter !== "all" ||
    query.trim() !== "";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Toaster richColors position="top-center" />
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-5xl md:text-6xl leading-none">
              My collection
            </h1>
            <p className="mt-3 text-muted-foreground max-w-lg">
              Every tree, every trim, every repotting — kept in one calm place.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="shrink-0">
                <Plus className="w-4 h-4" /> New tree
              </Button>
            </DialogTrigger>
            <NewTreeDialog onDone={() => setOpen(false)} />
          </Dialog>
        </div>

        {trees.length > 0 && (
          <div className="flex flex-col gap-3">
            <Input
              type="search"
              placeholder="Search by name or species…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-background max-w-md"
            />
            <div className="flex flex-col gap-2">
              <FilterRow
                label="Climate"
                value={climateFilter}
                onChange={setClimateFilter}
                options={CLIMATES.map((c) => ({
                  value: c.value,
                  label: `${c.emoji} ${c.label}`,
                }))}
              />
              <FilterRow
                label="Foliage"
                value={foliageFilter}
                onChange={setFoliageFilter}
                options={FOLIAGES.map((f) => ({
                  value: f.value,
                  label: f.label,
                }))}
              />
              <FilterRow
                label="Tag"
                value={tagFilter}
                onChange={setTagFilter}
                options={TAGS.map((t) => ({ value: t.value, label: t.label }))}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : trees.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <>
          <RemindersPanel trees={filtered} />
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map((t) => (
              <CompactTreeCard key={t.id} tree={t} />
            ))}
          </div>
          {filtered.length === 0 && hasActiveFilters && (
            <p className="text-sm text-muted-foreground">
              No trees match the current filters.
            </p>
          )}
        </>

      )}

      <section className="mt-14 border-t border-border pt-10">
        <h2 className="font-display text-4xl">Seasonal calendar</h2>
        <p className="mt-2 mb-6 text-muted-foreground max-w-lg">
          Build a year of work tuned to your climate zone and the kinds of trees
          you keep.
        </p>
        <BonsaiCalendar />
      </section>
    </div>
  );
}

type ReminderItem = {
  tree: Tree;
  label: "Fertilize" | "Prune" | "Repot";
  Icon: typeof Leaf;
  date: string;
  days: number;
};

function RemindersPanel({ trees }: { trees: Tree[] }) {
  const items: ReminderItem[] = [];
  for (const t of trees) {
    const rows = [
      { label: "Fertilize" as const, date: t.next_fert_date, Icon: Leaf },
      { label: "Prune" as const, date: t.next_prune_date, Icon: Scissors },
      { label: "Repot" as const, date: t.next_repot_date, Icon: FlowerIcon },
    ];
    for (const r of rows) {
      const d = daysUntil(r.date);
      if (r.date && d !== null && d <= 30) {
        items.push({ tree: t, label: r.label, Icon: r.Icon, date: r.date, days: d });
      }
    }
  }
  items.sort((a, b) => a.days - b.days);

  const overdue = items.filter((i) => i.days < 0);
  const dueToday = items.filter((i) => i.days === 0);
  const upcoming = items.filter((i) => i.days > 0);

  if (items.length === 0) {
    return (
      <div className="mb-8 border border-border rounded-lg bg-card p-5 flex items-center gap-3">
        <Bell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Nothing due in the next 30 days. All trees are resting easy.
        </span>
      </div>
    );
  }

  return (
    <div className="mb-8 border border-border rounded-lg bg-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2">
        <Bell className="w-4 h-4" />
        <h2 className="font-display text-2xl">Reminders</h2>
        <span className="text-xs text-muted-foreground ml-2">
          {overdue.length > 0 && `${overdue.length} overdue · `}
          {dueToday.length > 0 && `${dueToday.length} due today · `}
          {upcoming.length} upcoming
        </span>
      </div>
      <ul className="divide-y divide-border/60">
        {items.slice(0, 12).map((i, idx) => {
          const overdueItem = i.days < 0;
          const today = i.days === 0;
          const soon = i.days > 0 && i.days <= 7;
          const relative = overdueItem
            ? `${Math.abs(i.days)}d overdue`
            : today
              ? "Due today"
              : `in ${i.days}d`;
          return (
            <li key={idx}>
              <Link
                to="/trees/$id"
                params={{ id: i.tree.id }}
                className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors"
              >
                <i.Icon
                  className={`w-4 h-4 shrink-0 ${
                    overdueItem
                      ? "text-destructive"
                      : today || soon
                        ? "text-primary"
                        : "text-muted-foreground"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    <span className="font-medium">{i.label}</span>
                    <span className="text-muted-foreground"> · {i.tree.name}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-medium ${
                      overdueItem
                        ? "text-destructive"
                        : today || soon
                          ? "text-primary"
                          : "text-foreground"
                    }`}
                  >
                    {relative}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(i.date)}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="border border-dashed border-border rounded-lg p-12 text-center bg-card">
      <div className="font-display text-3xl mb-2">Plant the first record</div>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        Start by adding a tree. Give it a name, a species, and its care rhythm — the rest builds itself.
      </p>
      <Button onClick={onAdd}>
        <Plus className="w-4 h-4" /> Add a tree
      </Button>
    </div>
  );
}

function CompactTreeCard({ tree }: { tree: Tree }) {
  return (
    <Link
      to="/trees/$id"
      params={{ id: tree.id }}
      className="group flex flex-col"
    >
      <div className="aspect-square rounded-lg bg-card border border-border overflow-hidden">
        <SignedImg
          path={tree.cover_photo_url}
          alt={tree.name}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />
      </div>
      <span className="mt-1.5 text-sm truncate text-center font-medium">
        {tree.name}
      </span>
    </Link>
  );
}

function FilterRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs uppercase tracking-wide text-muted-foreground w-20 shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange("all")}
          className={
            "text-xs rounded-full px-2.5 py-1 border transition-colors " +
            (value === "all"
              ? "bg-foreground text-background border-foreground"
              : "bg-background border-border hover:border-primary/40")
          }
        >
          All
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={
              "text-xs rounded-full px-2.5 py-1 border transition-colors " +
              (value === o.value
                ? "bg-foreground text-background border-foreground"
                : "bg-background border-border hover:border-primary/40")
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const FREQS = ["weekly", "monthly", "annually"] as const;

function NewTreeDialog({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    species: "",
    acquired_on: todayISO(),
    notes: "",
    climate: "" as string,
    foliage: "" as string,
    style: "" as string,
    tags: [] as string[],
    soil_mix_id: "semi-inorganic" as string,
    ph: 6.5 as number,
    winter_location: "" as string,
    fert_frequency: "monthly" as (typeof FREQS)[number],
    prune_frequency: "annually" as (typeof FREQS)[number],
    repot_frequency: "annually" as (typeof FREQS)[number],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Auto-select soil when taxonomy changes.
  useEffect(() => {
    const id = computeDefaultSoil({
      climate: form.climate,
      foliage: form.foliage,
      tags: form.tags,
    });
    setForm((prev) =>
      prev.soil_mix_id === id ? prev : { ...prev, soil_mix_id: id },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.climate, form.foliage, form.tags.join(",")]);


  const create = useMutation({
    mutationFn: async () => {
      setSaving(true);
      const { data: created, error } = await supabase
        .from("trees")
        .insert({
          name: form.name,
          species: form.species || null,
          acquired_on: form.acquired_on || null,
          notes: form.notes || null,
          climate: form.climate || null,
          foliage: form.foliage || null,
          style: form.style || null,
          tags: form.tags,
          soil_mix_id: form.soil_mix_id || null,
          ph: form.ph,
          winter_location: form.winter_location || null,
          fert_frequency: form.fert_frequency,
          prune_frequency: form.prune_frequency,
          repot_frequency: form.repot_frequency,
        })
        .select("id")
        .single();
      if (error) throw error;

      if (file && created) {
        const path = await uploadPhoto(file, created.id);
        await supabase
          .from("trees")
          .update({ cover_photo_url: path })
          .eq("id", created.id);
        await supabase.from("tree_photos").insert({
          tree_id: created.id,
          url: path,
          taken_on: todayISO(),
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trees"] });
      toast.success("Tree added");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: () => setSaving(false),
  });

  return (
    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="font-display text-3xl">A new tree</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Old Master"
          />
        </div>
        <div>
          <Label>Species</Label>
          <Input
            value={form.species}
            onChange={(e) => setForm({ ...form, species: e.target.value })}
            placeholder="Juniperus procumbens"
          />
        </div>
        <div>
          <Label>Acquired on</Label>
          <Input
            type="date"
            value={form.acquired_on}
            onChange={(e) => setForm({ ...form, acquired_on: e.target.value })}
          />
        </div>
        <div>
          <Label>Notes</Label>
          <Textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Origin, styling, general condition… Markdown supported."
            rows={5}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Markdown supported — **bold**, *italics*, # headings, - lists.
          </p>
        </div>

        <div className="border border-border rounded-md p-4 bg-card space-y-4">
          <div>
            <Label>Hardiness & Climate</Label>
            <div role="radiogroup" className="mt-2 grid gap-2">
              {CLIMATES.map((c) => (
                <label
                  key={c.value}
                  className={
                    "flex items-start gap-3 rounded-md border p-3 cursor-pointer text-sm " +
                    (form.climate === c.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40")
                  }
                >
                  <input
                    type="radio"
                    name="new-climate"
                    value={c.value}
                    checked={form.climate === c.value}
                    onChange={() => setForm({ ...form, climate: c.value })}
                    className="mt-0.5"
                  />
                  <span className="flex-1">
                    <span className="font-medium">
                      {c.emoji} {c.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {c.hint}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Foliage & Growth Habit</Label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.foliage}
                onChange={(e) => setForm({ ...form, foliage: e.target.value })}
              >
                <option value="">Choose…</option>
                {FOLIAGES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label} — {o.hint}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Style</Label>
              <select
                className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.style}
                onChange={(e) => setForm({ ...form, style: e.target.value })}
              >
                <option value="">Choose…</option>
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label>Special Tags</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              Optional — select any that apply.
            </p>
            <TagPicker
              value={form.tags}
              onChange={(next) => setForm({ ...form, tags: next })}
            />
          </div>
        </div>

        <div className="border border-border rounded-md p-4 bg-card">
          <SoilSection
            soilMixId={form.soil_mix_id}
            ph={form.ph}
            winterLocation={form.winter_location}
            tags={form.tags}
            onSoilChange={(id) => setForm({ ...form, soil_mix_id: id })}
            onPhChange={(ph) => setForm({ ...form, ph })}
            onWinterChange={(loc) => setForm({ ...form, winter_location: loc })}
          />
        </div>


        <div>
          <Label>Cover photo</Label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              ["Fertilize", "fert_frequency"],
              ["Prune", "prune_frequency"],
              ["Repot", "repot_frequency"],
            ] as const
          ).map(([label, key]) => (
            <div key={key}>
              <Label className="text-xs">{label}</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form[key]}
                onChange={(e) =>
                  setForm({ ...form, [key]: e.target.value as (typeof FREQS)[number] })
                }
              >
                {FREQS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          You can fine-tune excluded months on the tree's page after creation.
        </p>
      </div>
      <DialogFooter>
        <Button
          onClick={() => create.mutate()}
          disabled={!form.name || saving}
        >
          {saving ? "Saving…" : "Add tree"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
