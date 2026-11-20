-- Fase 2: versões de edital por ano (cada edital pode apontar para a edição anterior).
-- Seguro rodar mais de uma vez.
ALTER TABLE public.library_sources
  ADD COLUMN IF NOT EXISTS previous_id uuid REFERENCES public.library_sources(id) ON DELETE SET NULL;
DO $$ BEGIN
  ALTER TABLE public.library_sources ADD CONSTRAINT library_sources_not_own_previous CHECK (previous_id IS NULL OR previous_id <> id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS library_sources_previous ON public.library_sources(previous_id);
