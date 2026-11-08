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