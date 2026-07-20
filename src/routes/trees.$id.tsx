import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SoilSection, SoilCard } from "@/components/SoilSection";
import { computeDefaultSoil, getSoil, winterLocationLabel } from "@/lib/soil";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SignedImg } from "@/components/SignedImg";
import { Markdown } from "@/components/Markdown";
import { TagChip, TagPicker } from "@/components/TagChip";
import {
  CLIMATES,
  FOLIAGES,
  STYLES,
  climateLabel,
  foliageLabel,
} from "@/lib/taxonomy";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  ArrowLeft,
  Leaf,
  Scissors,
  FlowerIcon,
  Plus,
  Trash2,
  Camera,
} from "lucide-react";
import {
  MONTHS,
  CARE_LABELS,
  computeNextDate,
  formatDate,
  daysUntil,
  todayISO,
  type Frequency,
} from "@/lib/care";
import { uploadPhoto } from "@/lib/storage";

export const Route = createFileRoute("/trees/$id")({
  component: TreeDetail,
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
  soil_mix_id: string | null;
  ph: number | null;
  winter_location: string | null;
  fert_frequency: Frequency;
  fert_excluded_months: number[];
  next_fert_date: string | null;
  prune_frequency: Frequency;
  prune_excluded_months: number[];
  next_prune_date: string | null;
  repot_frequency: Frequency;
  repot_excluded_months: number[];
  next_repot_date: string | null;
};

type CareEvent = {
  id: string;
  event_type: "fertilize" | "prune" | "repot";
  event_date: string;
  notes: string | null;
};

type Photo = {
  id: string;
  url: string;
  taken_on: string;
  caption: string | null;
};

const EVENT_KEYS = {
  fertilize: {
    freq: "fert_frequency" as const,
    excluded: "fert_excluded_months" as const,
    next: "next_fert_date" as const,
    Icon: Leaf,
  },
  prune: {
    freq: "prune_frequency" as const,
    excluded: "prune_excluded_months" as const,
    next: "next_prune_date" as const,
    Icon: Scissors,
  },
  repot: {
    freq: "repot_frequency" as const,
    excluded: "repot_excluded_months" as const,
    next: "next_repot_date" as const,
    Icon: FlowerIcon,
  },
};

function TreeDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data: tree, isLoading } = useQuery({
    queryKey: ["tree", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trees")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Tree;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("care_events")
        .select("id, event_type, event_date, notes")
        .eq("tree_id", id)
        .order("event_date", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CareEvent[];
    },
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tree_photos")
        .select("id, url, taken_on, caption")
        .eq("tree_id", id)
        .order("taken_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Photo[];
    },
  });

  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("trees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Tree removed");
      nav({ to: "/" });
    },
  });

  if (isLoading || !tree) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10 text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <Toaster richColors position="top-center" />
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> All trees
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_1.2fr] gap-8 mb-10">
        <div className="aspect-square rounded-lg overflow-hidden bg-muted border border-border">
          <SignedImg
            path={tree.cover_photo_url}
            alt={tree.name}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="font-display text-5xl leading-none">{tree.name}</h1>
          {tree.species && (
            <p className="italic text-muted-foreground mt-1">{tree.species}</p>
          )}
          {tree.acquired_on && (
            <p className="text-sm text-muted-foreground mt-2">
              Acquired {formatDate(tree.acquired_on)}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-muted-foreground">

            {climateLabel(tree.climate) && (
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5">
                {climateLabel(tree.climate)}
              </span>
            )}
            {foliageLabel(tree.foliage) && (
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5">
                {foliageLabel(tree.foliage)}
              </span>
            )}
            {tree.style && (
              <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5">
                {tree.style}
              </span>
            )}
          </div>
          {tree.tags && tree.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tree.tags.map((t) => (
                <TagChip key={t} value={t} />
              ))}
            </div>
          )}
          {tree.notes && (
            <div className="mt-4">
              <Markdown>{tree.notes}</Markdown>
            </div>
          )}
          <div className="mt-auto pt-6 flex flex-wrap gap-2">
            <EditTreeDialog tree={tree} />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-destructive">
                  <Trash2 className="w-4 h-4" /> Remove
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this tree?</AlertDialogTitle>
                  <AlertDialogDescription>
                    All care events and photos for {tree.name} will be permanently deleted.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => del.mutate()}>
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Next up */}
      <section className="mb-10">
        <h2 className="font-display text-3xl mb-4">Next up</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(["fertilize", "prune", "repot"] as const).map((k) => {
            const meta = EVENT_KEYS[k];
            const date = tree[meta.next];
            const d = daysUntil(date);
            return (
              <div
                key={k}
                className="rounded-lg border border-border bg-card p-5 flex flex-col"
              >
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <meta.Icon className="w-4 h-4" />
                  {CARE_LABELS[k]}
                </div>
                <div className="font-display text-3xl mt-2">
                  {formatDate(date)}
                </div>
                <div
                  className={
                    "text-xs mt-1 " +
                    (d === null
                      ? "text-muted-foreground"
                      : d < 0
                        ? "text-destructive"
                        : d <= 7
                          ? "text-primary"
                          : "text-muted-foreground")
                  }
                >
                  {d === null
                    ? "Not scheduled — log an event to start"
                    : d < 0
                      ? `${-d} day${-d === 1 ? "" : "s"} overdue`
                      : d === 0
                        ? "Today"
                        : `in ${d} day${d === 1 ? "" : "s"}`}
                </div>
                <LogEventDialog tree={tree} type={k} />
              </div>
            );
          })}
        </div>
      </section>

      {/* Soil & winter */}
      <SoilSummary tree={tree} />



      {/* Care log */}
      <section className="mb-10">
        <h2 className="font-display text-3xl mb-4">Care log</h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No entries yet. Every event you log resets the next date based on the schedule.
          </p>
        ) : (
          <ul className="border border-border rounded-lg bg-card divide-y divide-border">
            {events.map((e) => {
              const Icon = EVENT_KEYS[e.event_type].Icon;
              return (
                <li key={e.id} className="p-4 flex items-start gap-4">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium">
                        {CARE_LABELS[e.event_type]}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(e.event_date)}
                      </span>
                    </div>
                    {e.notes && (
                      <div className="mt-1 text-muted-foreground">
                        <Markdown>{e.notes}</Markdown>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      await supabase.from("care_events").delete().eq("id", e.id);
                      qc.invalidateQueries({ queryKey: ["events", id] });
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Photos */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-3xl">Progression</h2>
          <AddPhotoDialog treeId={tree.id} />
        </div>
        {photos.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            No photos yet. Add one every season to watch the tree evolve.
          </p>
        ) : (
          <PhotoGallery
            photos={photos}
            coverUrl={tree.cover_photo_url}
            treeId={tree.id}
          />
        )}
      </section>
    </div>
  );
}

function PhotoGallery({
  photos,
  coverUrl,
  treeId,
}: {
  photos: Photo[];
  coverUrl: string | null;
  treeId: string;
}) {
  const qc = useQueryClient();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex !== null ? photos[activeIndex] : null;

  async function deletePhoto(photo: Photo) {
    try {
      await supabase.storage.from("bonsai").remove([photo.url]);
      const { error } = await supabase
        .from("tree_photos")
        .delete()
        .eq("id", photo.id);
      if (error) throw error;
      if (coverUrl === photo.url) {
        await supabase
          .from("trees")
          .update({ cover_photo_url: null })
          .eq("id", treeId);
      }
      qc.invalidateQueries({ queryKey: ["photos", treeId] });
      qc.invalidateQueries({ queryKey: ["tree", treeId] });
      qc.invalidateQueries({ queryKey: ["trees"] });
      toast.success("Photo deleted");
      setActiveIndex(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <>
      <ul
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 list-none p-0"
        aria-label="Photo progression"
      >
        {photos.map((photo, index) => (
          <li key={photo.id}>
            <figure className="m-0">
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                className="group relative block w-full aspect-square rounded-md overflow-hidden bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label={`View photo from ${formatDate(photo.taken_on)}`}
              >
                <SignedImg
                  path={photo.url}
                  alt={photo.caption ?? `Photo taken on ${formatDate(photo.taken_on)}`}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </button>
              <figcaption className="mt-2 flex items-baseline justify-between gap-2">
                <time
                  dateTime={photo.taken_on}
                  className="text-sm text-foreground"
                >
                  {formatDate(photo.taken_on)}
                </time>
                {photo.caption && (
                  <span className="text-xs text-muted-foreground truncate">
                    {photo.caption}
                  </span>
                )}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => !open && setActiveIndex(null)}
      >
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl p-0 overflow-hidden">
          {active && (
            <>
              <DialogHeader className="px-5 pt-5 pb-3">
                <DialogTitle className="font-display text-2xl">
                  <time dateTime={active.taken_on}>
                    {formatDate(active.taken_on)}
                  </time>
                </DialogTitle>
                {active.caption && (
                  <p className="text-sm text-muted-foreground">
                    {active.caption}
                  </p>
                )}
              </DialogHeader>
              <div className="bg-black/80 flex items-center justify-center max-h-[75vh]">
                <SignedImg
                  path={active.url}
                  alt={active.caption ?? `Photo taken on ${formatDate(active.taken_on)}`}
                  className="max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>
              <DialogFooter className="px-5 py-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="w-4 h-4" /> Delete photo
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will remove the photo from this tree's progression.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePhoto(active)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function LogEventDialog({
  tree,
  type,
}: {
  tree: Tree;
  type: "fertilize" | "prune" | "repot";
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const meta = EVENT_KEYS[type];

  const save = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase.from("care_events").insert({
        tree_id: tree.id,
        event_type: type,
        event_date: date,
        notes: notes || null,
      });
      if (e1) throw e1;
      const nextDate = computeNextDate(
        date,
        tree[meta.freq],
        tree[meta.excluded] ?? [],
      );
      const update =
        type === "fertilize"
          ? { next_fert_date: nextDate }
          : type === "prune"
            ? { next_prune_date: nextDate }
            : { next_repot_date: nextDate };
      const { error: e2 } = await supabase
        .from("trees")
        .update(update)
        .eq("id", tree.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tree", tree.id] });
      qc.invalidateQueries({ queryKey: ["events", tree.id] });
      qc.invalidateQueries({ queryKey: ["trees"] });
      toast.success(`${CARE_LABELS[type]} logged`);
      setOpen(false);
      setNotes("");
      setDate(todayISO());
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="mt-4 w-full">
          <Plus className="w-3.5 h-3.5" /> Log {CARE_LABELS[type].toLowerCase()}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            Log {CARE_LABELS[type].toLowerCase()}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Date</Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Fertilizer type, cut details, soil mix… Markdown supported."
            />
            <p className="text-xs text-muted-foreground mt-1">
              Markdown supported — **bold**, *italics*, lists, links.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Next {CARE_LABELS[type].toLowerCase()} will be scheduled automatically
            based on the tree's {tree[meta.freq]} rhythm.
          </p>
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()}>Save entry</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const FREQS: Frequency[] = ["weekly", "monthly", "annually"];

function EditTreeDialog({ tree }: { tree: Tree }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(tree);

  useEffect(() => {
    const id = computeDefaultSoil({
      climate: f.climate,
      foliage: f.foliage,
      tags: f.tags ?? [],
    });
    setF((prev) => (prev.soil_mix_id === id ? prev : { ...prev, soil_mix_id: id }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.climate, f.foliage, (f.tags ?? []).join(",")]);


  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("trees")
        .update({
          name: f.name,
          species: f.species,
          acquired_on: f.acquired_on,
          notes: f.notes,
          climate: f.climate,
          foliage: f.foliage,
          style: f.style,
          tags: f.tags ?? [],
          soil_mix_id: f.soil_mix_id,
          ph: f.ph,
          winter_location: f.winter_location,
          fert_frequency: f.fert_frequency,
          fert_excluded_months: f.fert_excluded_months,
          prune_frequency: f.prune_frequency,
          prune_excluded_months: f.prune_excluded_months,
          repot_frequency: f.repot_frequency,
          repot_excluded_months: f.repot_excluded_months,
        })
        .eq("id", tree.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tree", tree.id] });
      qc.invalidateQueries({ queryKey: ["trees"] });
      toast.success("Updated");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMonth = (key: keyof Tree, m: number) => {
    const arr = (f[key] as number[]) ?? [];
    const next = arr.includes(m) ? arr.filter((x) => x !== m) : [...arr, m].sort((a, b) => a - b);
    setF({ ...f, [key]: next } as Tree);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Edit tree</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </div>
            <div>
              <Label>Species</Label>
              <Input
                value={f.species ?? ""}
                onChange={(e) => setF({ ...f, species: e.target.value })}
              />
            </div>
            <div>
              <Label>Acquired on</Label>
              <Input
                type="date"
                value={f.acquired_on ?? ""}
                onChange={(e) => setF({ ...f, acquired_on: e.target.value })}
              />
            </div>
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={f.notes ?? ""}
              onChange={(e) => setF({ ...f, notes: e.target.value })}
              rows={6}
              placeholder="Supports **bold**, *italics*, # headings, - lists, [links](url)…"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Markdown supported — bold, italics, headings, lists, links.
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
                      (f.climate === c.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40")
                    }
                  >
                    <input
                      type="radio"
                      name="climate"
                      value={c.value}
                      checked={f.climate === c.value}
                      onChange={() => setF({ ...f, climate: c.value })}
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
                  value={f.foliage ?? ""}
                  onChange={(e) =>
                    setF({ ...f, foliage: e.target.value || null })
                  }
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
                  value={f.style ?? ""}
                  onChange={(e) =>
                    setF({ ...f, style: e.target.value || null })
                  }
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
                value={f.tags ?? []}
                onChange={(next) => setF({ ...f, tags: next })}
              />
            </div>
          </div>

          <div className="border border-border rounded-md p-4 bg-card">
            <SoilSection
              soilMixId={f.soil_mix_id}
              ph={f.ph}
              winterLocation={f.winter_location}
              tags={f.tags ?? []}
              onSoilChange={(id) => setF({ ...f, soil_mix_id: id })}
              onPhChange={(ph) => setF({ ...f, ph })}
              onWinterChange={(loc) => setF({ ...f, winter_location: loc })}
            />
          </div>




          {(
            [
              ["fertilize", "fert_frequency", "fert_excluded_months"],
              ["prune", "prune_frequency", "prune_excluded_months"],
              ["repot", "repot_frequency", "repot_excluded_months"],
            ] as const
          ).map(([kind, freqKey, excKey]) => (
            <div key={kind} className="border border-border rounded-md p-4 bg-card">
              <div className="flex items-center justify-between mb-3">
                <div className="font-display text-xl">
                  {CARE_LABELS[kind]} schedule
                </div>
                <select
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                  value={f[freqKey]}
                  onChange={(e) => setF({ ...f, [freqKey]: e.target.value as Frequency })}
                >
                  {FREQS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>
              <Label className="text-xs text-muted-foreground">
                Skip these months (next date pushes forward)
              </Label>
              <div className="grid grid-cols-6 gap-1.5 mt-2">
                {MONTHS.map((m, i) => {
                  const monthNum = i + 1;
                  const active = ((f[excKey] as number[]) ?? []).includes(monthNum);
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => toggleMonth(excKey, monthNum)}
                      className={
                        "text-xs h-8 rounded border transition-colors " +
                        (active
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:border-primary/50")
                      }
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={() => save.mutate()}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPhotoDialog({ treeId }: { treeId: string }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [date, setDate] = useState(todayISO());
  const [caption, setCaption] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!file) return;
    setSaving(true);
    try {
      const path = await uploadPhoto(file, treeId);
      const { error } = await supabase.from("tree_photos").insert({
        tree_id: treeId,
        url: path,
        taken_on: date,
        caption: caption || null,
      });
      if (error) throw error;
      // Also update cover if none yet
      const { data: t } = await supabase
        .from("trees")
        .select("cover_photo_url")
        .eq("id", treeId)
        .single();
      if (t && !t.cover_photo_url) {
        await supabase.from("trees").update({ cover_photo_url: path }).eq("id", treeId);
      }
      qc.invalidateQueries({ queryKey: ["photos", treeId] });
      qc.invalidateQueries({ queryKey: ["tree", treeId] });
      qc.invalidateQueries({ queryKey: ["trees"] });
      toast.success("Photo added");
      setOpen(false);
      setFile(null);
      setCaption("");
      setDate(todayISO());
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary">
          <Camera className="w-4 h-4" /> Add photo
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Add photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Photo</Label>
            <Input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
          <div>
            <Label>Taken on</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Caption</Label>
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Post-styling, spring flush, etc."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={!file || saving}>
            {saving ? "Uploading…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SoilSummary({ tree }: { tree: Tree }) {
  const soil = getSoil(tree.soil_mix_id);
  const winter = winterLocationLabel(tree.winter_location);
  if (!soil && tree.ph == null && !winter) return null;

  return (
    <section className="mb-10">
      <h2 className="font-display text-3xl mb-4">Soil & winter</h2>
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4">
        {soil ? (
          <SoilCard soil={soil} selected />
        ) : (
          <div className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No soil mix chosen yet. Use Edit details to pick one.
          </div>
        )}
        <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-3 text-sm">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Soil pH
            </div>
            <div className="font-mono text-2xl mt-1">
              {tree.ph != null ? Number(tree.ph).toFixed(1) : "—"}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Winter location
            </div>
            <div className="mt-1">{winter ?? "—"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

