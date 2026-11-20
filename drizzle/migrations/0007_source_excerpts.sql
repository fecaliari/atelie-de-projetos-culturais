-- Fase 2: rastreabilidade (trechos importantes de cada fonte, com a página/artigo de origem).
-- Seguro rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS public.source_excerpts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  source_id uuid NOT NULL REFERENCES public.library_sources(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT '' CHECK (length(label) <= 120),
  location text NOT NULL DEFAULT '' CHECK (length(location) <= 120),
  excerpt text NOT NULL CHECK (length(trim(excerpt)) > 0 AND length(excerpt) <= 5000),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.source_excerpts TO authenticated;
GRANT ALL ON public.source_excerpts TO service_role;
ALTER TABLE public.source_excerpts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage source excerpts" ON public.source_excerpts;
CREATE POLICY "Owners manage source excerpts" ON public.source_excerpts FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.library_sources s WHERE s.id = source_id AND s.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS source_excerpts_source ON public.source_excerpts(source_id);
