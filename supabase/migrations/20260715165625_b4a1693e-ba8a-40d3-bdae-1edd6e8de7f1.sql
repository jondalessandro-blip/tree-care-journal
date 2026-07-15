
CREATE TABLE public.trees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species TEXT,
  acquired_on DATE,
  notes TEXT,
  cover_photo_url TEXT,
  fert_frequency TEXT NOT NULL DEFAULT 'monthly',
  fert_excluded_months INT[] NOT NULL DEFAULT '{}',
  next_fert_date DATE,
  prune_frequency TEXT NOT NULL DEFAULT 'annually',
  prune_excluded_months INT[] NOT NULL DEFAULT '{}',
  next_prune_date DATE,
  repot_frequency TEXT NOT NULL DEFAULT 'annually',
  repot_excluded_months INT[] NOT NULL DEFAULT '{}',
  next_repot_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trees TO anon, authenticated;
GRANT ALL ON public.trees TO service_role;
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read trees" ON public.trees FOR SELECT USING (true);
CREATE POLICY "public insert trees" ON public.trees FOR INSERT WITH CHECK (true);
CREATE POLICY "public update trees" ON public.trees FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete trees" ON public.trees FOR DELETE USING (true);

CREATE TABLE public.care_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('fertilize','prune','repot')),
  event_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX care_events_tree_idx ON public.care_events(tree_id, event_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.care_events TO anon, authenticated;
GRANT ALL ON public.care_events TO service_role;
ALTER TABLE public.care_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read care" ON public.care_events FOR SELECT USING (true);
CREATE POLICY "public insert care" ON public.care_events FOR INSERT WITH CHECK (true);
CREATE POLICY "public update care" ON public.care_events FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete care" ON public.care_events FOR DELETE USING (true);

CREATE TABLE public.tree_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id UUID NOT NULL REFERENCES public.trees(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  taken_on DATE NOT NULL DEFAULT (now()::date),
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tree_photos_tree_idx ON public.tree_photos(tree_id, taken_on DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tree_photos TO anon, authenticated;
GRANT ALL ON public.tree_photos TO service_role;
ALTER TABLE public.tree_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read photos" ON public.tree_photos FOR SELECT USING (true);
CREATE POLICY "public insert photos" ON public.tree_photos FOR INSERT WITH CHECK (true);
CREATE POLICY "public update photos" ON public.tree_photos FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete photos" ON public.tree_photos FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;
CREATE TRIGGER trees_updated_at BEFORE UPDATE ON public.trees FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
