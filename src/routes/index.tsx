import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { formatDate, daysUntil, todayISO } from "@/lib/care";
import { uploadPhoto } from "@/lib/storage";
import { Plus, Leaf, Scissors, FlowerIcon } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

type Tree = {
  id: string;
  name: string;
  species: string | null;
  acquired_on: string | null;
  cover_photo_url: string | null;
  next_fert_date: string | null;
  next_prune_date: string | null;
  next_repot_date: string | null;
};

async function fetchTrees(): Promise<Tree[]> {
  const { data, error } = await supabase
    .from("trees")
    .select(
      "id, name, species, acquired_on, cover_photo_url, next_fert_date, next_prune_date, next_repot_date",
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

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <Toaster richColors position="top-center" />
      <div className="flex items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-5xl md:text-6xl leading-none">
            Your collection
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

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : trees.length === 0 ? (
        <EmptyState onAdd={() => setOpen(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map((t) => (
            <TreeCard key={t.id} tree={t} />
          ))}
        </div>
      )}
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

function TreeCard({ tree }: { tree: Tree }) {
  const next = [
    { label: "Fertilize", date: tree.next_fert_date, Icon: Leaf },
    { label: "Prune", date: tree.next_prune_date, Icon: Scissors },
    { label: "Repot", date: tree.next_repot_date, Icon: FlowerIcon },
  ];
  return (
    <Link
      to="/trees/$id"
      params={{ id: tree.id }}
      className="group block bg-card border border-border rounded-lg overflow-hidden hover:border-primary/60 transition-colors"
    >
      <div className="aspect-[4/3] bg-muted overflow-hidden">
        <SignedImg
          path={tree.cover_photo_url}
          alt={tree.name}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-display text-2xl truncate">{tree.name}</h3>
          {tree.acquired_on && (
            <span className="text-xs text-muted-foreground shrink-0">
              since {new Date(tree.acquired_on).getFullYear()}
            </span>
          )}
        </div>
        {tree.species && (
          <p className="text-sm italic text-muted-foreground">{tree.species}</p>
        )}
        <div className="mt-4 hairline pt-3 space-y-1.5">
          {next.map(({ label, date, Icon }) => {
            const d = daysUntil(date);
            const overdue = d !== null && d < 0;
            const soon = d !== null && d >= 0 && d <= 7;
            return (
              <div
                key={label}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </span>
                <span
                  className={
                    overdue
                      ? "text-destructive font-medium"
                      : soon
                        ? "text-primary font-medium"
                        : "text-foreground"
                  }
                >
                  {formatDate(date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Link>
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
    fert_frequency: "monthly" as (typeof FREQS)[number],
    prune_frequency: "annually" as (typeof FREQS)[number],
    repot_frequency: "annually" as (typeof FREQS)[number],
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

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
            placeholder="Origin, styling, general condition…"
            rows={3}
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
