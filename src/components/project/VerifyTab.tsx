import { useQuery } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Answer, Project } from "@/lib/data";
import type { Template } from "@/lib/templates";
import { runChecks } from "@/lib/verify";
import { brl } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/components/ai-elements/message";
import { Shimmer } from "@/components/ai-elements/shimmer";

const transport = new DefaultChatTransport({
  api: "/api/verify",
  headers: async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  },
});

export function VerifyTab({ project, template, answers }: { project: Project; template: Template; answers: Answer[] }) {
  const id = project.id;
  const { data } = useQuery({
    queryKey: ["verify-data", id],
    queryFn: async () => {
      const [b, s, t, d] = await Promise.all([
        supabase.from("budget_items").select("*").eq("project_id", id),
        supabase.from("schedule_items").select("*").eq("project_id", id),
        supabase.from("team_members").select("*").eq("project_id", id),
        supabase.from("project_documents").select("name").eq("project_id", id),
      ]);
      return { budget: b.data ?? [], schedule: s.data ?? [], team: t.data ?? [], docs: d.data ?? [] };
    },
  });
  const { messages, sendMessage, status, setMessages } = useChat({
    transport,
    onError: (e) => {
      const m = e.message || "";
      toast.error(m.includes("429") ? "Muitos pedidos seguidos. Aguarde um pouco." : m.includes("402") ? "Créditos de IA esgotados." : "Não foi possível fazer a análise agora.");
    },
  });
  if (!data) return <p className="text-muted-foreground">Carregando…</p>;

  const amap = Object.fromEntries(answers.map((a) => [a.field_key, a.content ?? ""]));
  const findings = runChecks({
    fields: template.fields, answers: amap, budget: data.budget, schedule: data.schedule, team: data.team,
    docs: data.docs.length, accessibility: project.accessibility, democratization: project.democratization,
  });
  const busy = status === "submitted" || status === "streaming";
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  const report = last?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";

  function analyze() {
    const dump = [
      `Edital/modelo: ${template.name} (${template.mechanism})`,
      `Projeto: ${project.name}`,
      ...template.fields.map((f) => `### ${f.section} — ${f.label}${f.maxChars ? ` (máx. ${f.maxChars})` : ""}\n${amap[f.key] || "(sem resposta)"}`),
      `## Orçamento\n${data!.budget.map((b) => `- [${b.category}] ${b.description}: ${b.quantity} ${b.unit} × ${brl(Number(b.unit_value))} × ${b.occurrences}`).join("\n") || "(vazio)"}`,
      `## Cronograma\n${data!.schedule.map((s) => `- [${s.phase}] ${s.activity} ${s.start_date ?? ""}–${s.end_date ?? ""} ${s.location ?? ""}`).join("\n") || "(vazio)"}`,
      `## Equipe\n${data!.team.map((t) => `- ${t.name} — ${t.role}`).join("\n") || "(vazia)"}`,
      `## Acessibilidade\n${JSON.stringify(project.accessibility)}`,
      `## Democratização\n${JSON.stringify(project.democratization)}`,
      `## Documentos anexados\n${data!.docs.map((d) => `- ${d.name}`).join("\n") || "(nenhum)"}`,
    ].join("\n\n");
    setMessages([]);
    sendMessage({ text: dump });
  }

  const color = { erro: "border-destructive", alerta: "border-terra", ok: "border-primary" } as const;
  return (
    <div className="space-y-10">
      <section>
        <p className="eyebrow">Conferências automáticas</p>
        <ul className="mt-3 space-y-2">
          {findings.map((f, i) => (
            <li key={i} className={`border-l-2 bg-paper px-4 py-2 text-sm ${color[f.level]}`}>
              <b className="mr-2 uppercase text-xs">{f.level}</b>{f.title}
              {f.detail && <span className="text-muted-foreground"> — {f.detail}</span>}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Análise por IA</p>
            <p className="text-sm text-muted-foreground">Erros de texto, ações sem custo, metas, coerência e estimativa de aprovação.</p>
          </div>
          <Button onClick={analyze} disabled={busy}>{report ? "Analisar de novo" : "Analisar projeto"}</Button>
        </div>
        {busy && !report && <Shimmer className="mt-4 text-sm">Lendo o projeto…</Shimmer>}
        {report && <div className="mt-4 border border-border bg-paper p-5 text-sm"><MessageResponse>{report}</MessageResponse></div>}
      </section>
    </div>
  );
}
