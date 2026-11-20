import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Answer, Project } from "@/lib/data";
import type { Template } from "@/lib/templates";
import { runChecks } from "@/lib/verify";
import { brl } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { PromptCard } from "@/components/PromptCard";
import { VERIFY_INSTRUCTIONS, composePrompt } from "@/lib/prompts";
import { sourceForPrompt } from "@/lib/library";

export function VerifyTab({
  project,
  template,
  answers,
}: {
  project: Project;
  template: Template;
  answers: Answer[];
}) {
  const id = project.id;
  const { data } = useQuery({
    queryKey: ["verify-data", id],
    queryFn: async () => {
      const [b, s, t, d, l] = await Promise.all([
        supabase.from("budget_items").select("*").eq("project_id", id),
        supabase.from("schedule_items").select("*").eq("project_id", id),
        supabase.from("team_members").select("*").eq("project_id", id),
        supabase.from("project_documents").select("name").eq("project_id", id),
        supabase.from("project_sources").select("source_id").eq("project_id", id),
      ]);
      const ids = (l.data ?? []).map((x) => x.source_id);
      const ex = ids.length ? (await supabase.from("source_excerpts").select("*").in("source_id", ids).order("created_at")).data ?? [] : [];
      const linked = ids.length ? (await supabase.from("library_sources").select("*").in("id", ids)).data ?? [] : [];
      return {
        budget: b.data ?? [],
        schedule: s.data ?? [],
        team: t.data ?? [],
        docs: d.data ?? [],
        excerpts: ex,
        editais: linked.filter((x) => x.library === "editais"),
        referencias: linked.filter((x) => x.library === "referencias"),
      };
    },
  });
  const [prompt, setPrompt] = useState("");
  if (!data) return <p className="text-muted-foreground">Carregando…</p>;

  const amap = Object.fromEntries(answers.map((a) => [a.field_key, a.content ?? ""]));
  const findings = runChecks({
    fields: template.fields,
    answers: amap,
    budget: data.budget,
    schedule: data.schedule,
    team: data.team,
    docs: data.docs.length,
    accessibility: project.accessibility,
    democratization: project.democratization,
  });
  function analyze() {
    const dump = [
      `Edital/modelo: ${template.name} (${template.mechanism})`,
      ...(data!.editais.length ? [`## Edital de destino (regras a conferir)\n${data!.editais.map((e) => sourceForPrompt(e, 60000, data!.excerpts.filter((x) => x.source_id === e.id))).join("\n\n")}`] : []),
      ...(data!.referencias.length ? [`## Referências ligadas ao projeto\n${data!.referencias.map((e) => sourceForPrompt(e, 8000, data!.excerpts.filter((x) => x.source_id === e.id))).join("\n\n")}`] : []),
      `Projeto: ${project.name}`,
      ...template.fields.map(
        (f) =>
          `### ${f.section} — ${f.label}${f.maxChars ? ` (máx. ${f.maxChars})` : ""}\n${amap[f.key] || "(sem resposta)"}`,
      ),
      `## Orçamento\n${data!.budget.map((b) => `- [${b.category}] ${b.description}: ${b.quantity} ${b.unit} × ${brl(Number(b.unit_value))} × ${b.occurrences}`).join("\n") || "(vazio)"}`,
      `## Cronograma\n${data!.schedule.map((s) => `- [${s.phase}] ${s.activity} ${s.start_date ?? ""}–${s.end_date ?? ""} ${s.location ?? ""}`).join("\n") || "(vazio)"}`,
      `## Equipe\n${data!.team.map((t) => `- ${t.name} — ${t.role}`).join("\n") || "(vazia)"}`,
      `## Acessibilidade\n${JSON.stringify(project.accessibility)}`,
      `## Democratização\n${JSON.stringify(project.democratization)}`,
      `## Documentos anexados\n${data!.docs.map((d) => `- ${d.name}`).join("\n") || "(nenhum)"}`,
    ].join("\n\n");
    setPrompt(composePrompt(VERIFY_INSTRUCTIONS, dump));
  }

  const color = {
    erro: "border-destructive",
    alerta: "border-terra",
    ok: "border-primary",
  } as const;
  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow">Conferências automáticas</p>
        <ul className="mt-3 space-y-2">
          {findings.map((f, i) => (
            <li key={i} className={`border-l-2 bg-paper px-4 py-2 text-sm ${color[f.level]}`}>
              <b className="mr-2 uppercase text-xs">{f.level}</b>
              {f.title}
              {f.detail && <span className="text-muted-foreground"> — {f.detail}</span>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Análise por IA</p>
            <p className="text-sm text-muted-foreground">
              Erros de texto, ações sem custo, metas, coerência e estimativa de aprovação, feitos no
              seu chat de IA.
            </p>
          </div>
          <Button onClick={analyze}>
            {prompt ? "Atualizar texto" : "Preparar texto para a IA"}
          </Button>
        </div>
        {prompt && (
          <div className="mt-4">
            <PromptCard
              prompt={prompt}
              hint="Copie o texto abaixo e cole no Claude, ChatGPT ou Gemini. A resposta aparece lá, no seu chat. Seu projeto só vai pra onde você colar."
            />
          </div>
        )}
      </section>
    </div>
  );
}
