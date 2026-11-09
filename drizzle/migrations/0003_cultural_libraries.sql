CREATE TABLE public.library_sources (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(),
 library text NOT NULL CHECK (library IN ('editais','referencias')),
 title text NOT NULL CHECK (length(trim(title)) > 0), kind text NOT NULL CHECK (kind IN ('arquivo','link','video','texto')),
 url text, file_path text, file_name text, content text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '',
 analysis text NOT NULL DEFAULT '', reviewed boolean NOT NULL DEFAULT false,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.library_sources TO authenticated;
GRANT ALL ON public.library_sources TO service_role;
ALTER TABLE public.library_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners access library sources" ON public.library_sources FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE INDEX library_sources_owner_library ON public.library_sources(user_id,library);
CREATE POLICY "Owners access library files" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text) WITH CHECK (bucket_id = 'library-files' AND (storage.foldername(name))[1] = auth.uid()::text);