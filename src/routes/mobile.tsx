import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SignedImg } from "@/components/SignedImg";
import { ChevronLeft, LayoutGrid } from "lucide-react";

export const Route = createFileRoute("/mobile")({
  component: MobileCollection,
});

type Tree = {
  id: string;
  name: string;
  species: string | null;
  cover_photo_url: string | null;
};

async function fetchTrees(): Promise<Tree[]> {
  const { data, error } = await supabase
    .from("trees")
    .select("id, name, species, cover_photo_url")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Tree[];
}

function MobileCollection() {
  const { data: trees = [], isLoading } = useQuery({
    queryKey: ["trees"],
    queryFn: fetchTrees,
  });
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? trees.filter((t) =>
        [t.name, t.species]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
      )
    : trees;

  return (
    <div className="mx-auto max-w-2xl px-4 py-5">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link to="/">
            <ChevronLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="font-display text-3xl leading-none">Collection</h1>
      </div>

      {trees.length > 0 && (
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Find a tree…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-background"
          />
        </div>
      )}

      {isLoading ? (
        <div className="text-muted-foreground text-sm">Loading…</div>
      ) : trees.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No trees yet.</p>
          <Button asChild>
            <Link to="/">Add a tree</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              to="/trees/$id"
              params={{ id: t.id }}
              className="group flex flex-col"
            >
              <div className="aspect-square rounded-lg bg-card border border-border overflow-hidden">
                <SignedImg
                  path={t.cover_photo_url}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
              </div>
              <span className="mt-1.5 text-sm truncate text-center font-medium">
                {t.name}
              </span>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && query.trim() && (
        <p className="text-sm text-muted-foreground text-center mt-6">
          No trees match “{query.trim()}”.
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <Button variant="outline" size="sm" className="gap-2" asChild>
          <Link to="/">
            <LayoutGrid className="w-4 h-4" />
            Full collection view
          </Link>
        </Button>
      </div>
    </div>
  );
}
