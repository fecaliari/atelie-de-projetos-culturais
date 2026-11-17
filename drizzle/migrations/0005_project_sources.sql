-- Fase 2: ligações entre projetos e fontes da biblioteca (edital de destino e referências usadas).
-- Seguro rodar mais de uma vez.
CREATE TABLE IF NOT EXISTS public.project_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.library_sources(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, source_id)
);
GRANT SELECT, INSERT, DELETE ON public.project_sources TO authenticated;
GRANT ALL ON public.project_sources TO service_role;
ALTER TABLE public.project_sources ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners manage project sources" ON public.project_sources;
CREATE POLICY "Owners manage project sources" ON public.project_sources FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.library_sources s WHERE s.id = source_id AND s.user_id = auth.uid()));
CREATE INDEX IF NOT EXISTS project_sources_project ON public.project_sources(project_id);
CREATE INDEX IF NOT EXISTS project_sources_source ON public.project_sources(source_id);
