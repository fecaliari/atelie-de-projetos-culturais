-- Ateliê Cultural: estrutura completa do banco (rodar uma vez no SQL Editor do Supabase)
-- Cria os dois locais de arquivos e depois aplica as 4 migrações do projeto, em ordem.

INSERT INTO storage.buckets (id, name, public) VALUES ('project-files','project-files',false), ('library-files','library-files',false) ON CONFLICT (id) DO NOTHING;


-- ===== 0000_atelie_fase1.sql =====

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  mechanism text,
  base_key text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.templates TO authenticated;
GRANT ALL ON public.templates TO service_role;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own templates" ON public.templates FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_templates BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  summary text,
  languages text[] NOT NULL DEFAULT '{}',
  category text,
  format text,
  territory text,
  proponent_type text,
  proponent_name text,
  mechanism text,
  template_ref text NOT NULL DEFAULT 'builtin:generico',
  status text NOT NULL DEFAULT 'ideia',
  accessibility jsonb NOT NULL DEFAULT '{}'::jsonb,
  democratization jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own projects" ON public.projects FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER t_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, field_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.answers TO authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own answers" ON public.answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.answer_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answer_id uuid NOT NULL REFERENCES public.answers(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.answer_versions TO authenticated;
GRANT ALL ON public.answer_versions TO service_role;
ALTER TABLE public.answer_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own versions read" ON public.answer_versions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own versions delete" ON public.answer_versions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- keep a version when content changes, at most one per 2 minutes (overwrite latest within window)
CREATE OR REPLACE FUNCTION public.answers_versioning() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE last_v record;
BEGIN
  NEW.updated_at = now();
  IF TG_OP = 'UPDATE' AND NEW.content IS NOT DISTINCT FROM OLD.content THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND coalesce(OLD.content,'') <> '' THEN
    SELECT * INTO last_v FROM public.answer_versions WHERE answer_id = OLD.id ORDER BY created_at DESC LIMIT 1;
    IF last_v IS NULL OR last_v.created_at < now() - interval '2 minutes' THEN
      INSERT INTO public.answer_versions(user_id, answer_id, content) VALUES (OLD.user_id, OLD.id, OLD.content);
    END IF;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER t_answers BEFORE UPDATE ON public.answers FOR EACH ROW EXECUTE FUNCTION public.answers_versioning();

CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'Produção',
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'serviço',
  quantity numeric NOT NULL DEFAULT 1,
  occurrences numeric NOT NULL DEFAULT 1,
  unit_value numeric NOT NULL DEFAULT 0,
  notes text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.schedule_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase text NOT NULL DEFAULT 'Pré-produção',
  activity text NOT NULL DEFAULT '',
  location text,
  start_date date,
  end_date date,
  duration text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT '',
  bio text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL,
  size bigint,
  mime text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_items, public.schedule_items, public.team_members, public.project_documents TO authenticated;
GRANT ALL ON public.budget_items, public.schedule_items, public.team_members, public.project_documents TO service_role;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON public.budget_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.schedule_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.team_members FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own" ON public.project_documents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "own files read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own files delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'project-files' AND (storage.foldername(name))[1] = auth.uid()::text);


-- ===== 0001_project_collaboration.sql =====
CREATE TABLE public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  email text NOT NULL,
  invited_by uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, email)
);
GRANT SELECT, INSERT, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_project_owner(_pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _pid AND user_id = auth.uid())
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(_pid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.projects WHERE id = _pid AND user_id = auth.uid())
      OR EXISTS (SELECT 1 FROM public.project_members WHERE project_id = _pid
                 AND lower(email) = lower(coalesce(auth.jwt()->>'email','')))
$$;

CREATE OR REPLACE FUNCTION public.can_access_project_text(_pid text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN public.can_access_project(_pid::uuid);
EXCEPTION WHEN others THEN RETURN false;
END $$;

CREATE POLICY "members read" ON public.project_members FOR SELECT TO authenticated
  USING (public.can_access_project(project_id));
CREATE POLICY "owner invites" ON public.project_members FOR INSERT TO authenticated
  WITH CHECK (public.is_project_owner(project_id));
CREATE POLICY "owner removes or self leaves" ON public.project_members FOR DELETE TO authenticated
  USING (public.is_project_owner(project_id) OR lower(email) = lower(coalesce(auth.jwt()->>'email','')));

CREATE POLICY "shared read" ON public.projects FOR SELECT TO authenticated USING (public.can_access_project(id));
CREATE POLICY "shared update" ON public.projects FOR UPDATE TO authenticated USING (public.can_access_project(id)) WITH CHECK (public.can_access_project(id));

CREATE POLICY "shared" ON public.answers FOR ALL TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.can_access_project(project_id));
CREATE POLICY "shared" ON public.budget_items FOR ALL TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.can_access_project(project_id));
CREATE POLICY "shared" ON public.schedule_items FOR ALL TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.can_access_project(project_id));
CREATE POLICY "shared" ON public.team_members FOR ALL TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.can_access_project(project_id));
CREATE POLICY "shared" ON public.project_documents FOR ALL TO authenticated USING (public.can_access_project(project_id)) WITH CHECK (public.can_access_project(project_id));
CREATE POLICY "shared versions read" ON public.answer_versions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.answers a WHERE a.id = answer_id AND public.can_access_project(a.project_id)));

CREATE POLICY "shared files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-files' AND public.can_access_project_text((storage.foldername(name))[2]));
CREATE POLICY "shared files insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files' AND public.can_access_project_text((storage.foldername(name))[2]));
CREATE POLICY "shared files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files' AND public.can_access_project_text((storage.foldername(name))[2]));

-- ===== 0002_shared_template_read.sql =====
CREATE POLICY "read templates of shared projects" ON public.templates FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.projects p WHERE p.template_ref = 'custom:' || templates.id::text AND public.can_access_project(p.id)));

-- ===== 0003_cultural_libraries.sql =====
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
