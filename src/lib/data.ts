import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { builtinTemplate, type Template, type TemplateField } from "./templates";

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Answer = Database["public"]["Tables"]["answers"]["Row"];
export type BudgetItem = Database["public"]["Tables"]["budget_items"]["Row"];
export type ScheduleItem = Database["public"]["Tables"]["schedule_items"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type ProjectDoc = Database["public"]["Tables"]["project_documents"]["Row"];
export type CustomTemplate = Database["public"]["Tables"]["templates"]["Row"];

function must<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: async () => must(await supabase.from("projects").select("*").order("updated_at", { ascending: false })),
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: ["project", id],
    queryFn: async () => must(await supabase.from("projects").select("*").eq("id", id).single()),
  });

export const useAnswers = (projectId: string) =>
  useQuery({
    queryKey: ["answers", projectId],
    queryFn: async () => must(await supabase.from("answers").select("*").eq("project_id", projectId)),
  });

export const useAllAnswers = () =>
  useQuery({
    queryKey: ["answers", "all"],
    queryFn: async () => must(await supabase.from("answers").select("project_id, field_key, content")),
  });

export const useCustomTemplates = () =>
  useQuery({
    queryKey: ["templates"],
    queryFn: async () => must(await supabase.from("templates").select("*").order("updated_at", { ascending: false })),
  });

export function customToTemplate(t: CustomTemplate): Template {
  return {
    ref: `custom:${t.id}`,
    name: t.name,
    mechanism: t.mechanism ?? "Modelo próprio",
    fields: (t.fields as unknown as TemplateField[]) ?? [],
  };
}

export function useTemplate(ref: string | undefined) {
  const custom = ref?.startsWith("custom:") ? ref.slice(7) : null;
  const q = useQuery({
    queryKey: ["template", custom],
    enabled: !!custom,
    queryFn: async () => must(await supabase.from("templates").select("*").eq("id", custom!).single()),
  });
  if (!ref) return undefined;
  if (!custom) return builtinTemplate(ref) ?? builtinTemplate("builtin:generico");
  const d = q.data as CustomTemplate | undefined;
  return d ? customToTemplate(d) : undefined;
}

export function useUpdateProject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: Database["public"]["Tables"]["projects"]["Update"]) =>
      must(await supabase.from("projects").update(patch).eq("id", id).select().single()),
    onSuccess: (p) => {
      qc.setQueryData(["project", id], p);
      qc.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export async function saveAnswer(projectId: string, fieldKey: string, content: string) {
  return must(
    await supabase
      .from("answers")
      .upsert({ project_id: projectId, field_key: fieldKey, content }, { onConflict: "project_id,field_key" })
      .select()
      .single(),
  );
}

export async function duplicateProject(p: Project) {
  const { id, created_at, updated_at, last_opened_at, user_id, ...rest } = p;
  void created_at; void updated_at; void last_opened_at; void user_id;
  const copy: Project = must(await supabase.from("projects").insert({ ...rest, name: `${p.name} (cópia)`, status: "ideia" }).select().single());
  const answers = must(await supabase.from("answers").select("field_key, content").eq("project_id", id));
  if (answers.length) await supabase.from("answers").insert(answers.map((a) => ({ ...a, project_id: copy.id })));
  for (const t of ["budget_items", "schedule_items", "team_members"] as const) {
    const rows = must(await supabase.from(t).select("*").eq("project_id", id)) as Record<string, unknown>[];
    if (rows.length)
      await supabase.from(t).insert(
        rows.map(({ id: _i, created_at: _c, user_id: _u, ...r }) => ({ ...r, project_id: copy.id })) as never,
      );
  }
  return copy;
}
