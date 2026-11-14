import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Answer, Project } from "@/lib/data";
import type { Template } from "@/lib/templates";
import { buildExportModel, deliverFile, fileName } from "@/lib/exportDoc";
import { brl } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function ExportTab({ project, template, answers }: { project: Project; template: Template; answers: Answer[] }) {
  const id = project.id;
  const [busy, setBusy] = useState<"" | "docx" | "pdf" | "xlsx">("");
  const [erro, setErro] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["export-data", id],
    queryFn: async () => {
      const [b, s, t, d] = await Promise.all([
        supabase.from("budget_items").select("*").eq("project_id", id).order("position"),
        supabase.from("schedule_items").select("*").eq("project_id", id).order("position"),
        supabase.from("team_members").select("*").eq("project_id", id).order("position"),
        supabase.from("project_documents").select("name").eq("project_id", id).order("created_at"),
      ]);
      return { budget: b.data ?? [], schedule: s.data ?? [], team: t.data ?? [], docs: d.data ?? [] };
    },
  });

  async function make(kind: "docx" | "pdf" | "xlsx") {
    if (!data) return;
    setBusy(kind);
    setErro("");
    try {
      const model = buildExportModel({ project, template, answers, ...data });
      if (kind === "docx") {
        const { buildDocx } = await import("@/lib/exportDocx");
        await deliverFile(await buildDocx(model), fileName(project.name, "docx"));
      } else if (kind === "xlsx") {
        const { buildXlsx } = await import("@/lib/exportXlsx");
        await deliverFile(await buildXlsx(model), fileName(`${project.name}-orcamento`, "xlsx"));
      } else {
        const { buildPdf } = await import("@/lib/exportPdf");
        await deliverFile(await buildPdf(model), fileName(project.name, "pdf"));
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o arquivo.");
    } finally {
      setBusy("");
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Carregando…</p>;

  const model = data ? buildExportModel({ project, template, answers, ...data }) : null;
  const respondidas = model ? model.sections.flatMap((s) => s.rows).filter((r) => r.text !== "— sem resposta —").length : 0;
  const total = model ? model.sections.flatMap((s) => s.rows).length : 0;

  return (
    <div className="space-y-8">
      <div>
        <p className="eyebrow">Exportar projeto</p>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Gera um arquivo com tudo o que foi digitado, exatamente como está — nada é reescrito nem resumido. Dá para abrir no Word,
          no Google Docs ou enviar para outra pessoa.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={() => make("docx")} disabled={!!busy}>
          {busy === "docx" ? "Gerando…" : "Baixar Word (.docx)"}
        </Button>
        <Button variant="outline" onClick={() => make("pdf")} disabled={!!busy}>
          {busy === "pdf" ? "Gerando…" : "Baixar PDF"}
        </Button>
        <Button variant="outline" onClick={() => make("xlsx")} disabled={!!busy}>
          {busy === "xlsx" ? "Gerando…" : "Baixar planilha (.xlsx)"}
        </Button>
      </div>
      {erro && <p className="text-sm text-destructive">{erro}</p>}

      {model && (
        <div className="grid gap-x-10 gap-y-2 border-t border-border pt-6 text-sm md:grid-cols-2">
          <p className="flex justify-between border-b border-border py-2"><span>Perguntas respondidas</span><span>{respondidas} de {total}</span></p>
          <p className="flex justify-between border-b border-border py-2"><span>Itens no orçamento</span><span>{model.budget.lines.length}</span></p>
          <p className="flex justify-between border-b border-border py-2"><span>Atividades no cronograma</span><span>{model.schedule.length}</span></p>
          <p className="flex justify-between border-b border-border py-2"><span>Pessoas na equipe</span><span>{model.team.length}</span></p>
          <p className="flex justify-between border-b border-border py-2"><span>Documentos anexados</span><span>{model.documents.length}</span></p>
          <p className="flex justify-between border-b border-border py-2"><span>Total do orçamento</span><span className="tabular-nums">{brl(model.budget.total)}</span></p>
        </div>
      )}

      <p className="text-xs text-muted-foreground">A planilha traz o orçamento com fórmulas (mude a quantidade e o total recalcula), o resumo por categoria, o cronograma e a equipe. O Word e o PDF trazem: informações gerais, todas as respostas por etapa, orçamento, cronograma, equipe, acessibilidade, democratização e a lista de documentos anexados.</p>
    </div>
  );
}
