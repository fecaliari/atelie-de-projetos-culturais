-- Fase 2: etiquetas e metadados nas fontes da biblioteca.
-- Seguro rodar mais de uma vez.
ALTER TABLE public.library_sources
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS year integer CHECK (year IS NULL OR year BETWEEN 1990 AND 2100),
  ADD COLUMN IF NOT EXISTS sphere text CHECK (sphere IS NULL OR sphere IN ('federal','estadual','municipal','privado','outro')),
  ADD COLUMN IF NOT EXISTS organ text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS deadline date;
CREATE INDEX IF NOT EXISTS library_sources_tags ON public.library_sources USING gin (tags);
