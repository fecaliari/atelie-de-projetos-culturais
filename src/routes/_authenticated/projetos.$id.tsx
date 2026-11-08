import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { saveAnswer, useAnswers, useProject, useTemplate, useUpdateProject } from "@/lib/data";
import { STATUSES } from "@/lib/constants";
import { sectionsOf, type TemplateField } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { VerifyTab } from "@/components/project/VerifyTab";
import { ExportTab } from "@/components/project/ExportTab";
import { ShareTab } from "@/components/project/ShareTab";
import { AccessibilityTab, BudgetTab, DemocratizationTab, DocumentsTab, ScheduleTab, TeamTab } from "@/components/project/ProjectTabs";

const TABS = ["Perguntas", "Orçamento", "Cronograma", "Equipe", "Acessibilidade", "Democratização", "Documentos", "Verificação", "Exportar", "Colaboração"] as const;

export const Route = createFileRoute("/_authenticated/projetos/$id")({
    head: () => ({ meta: [{ title: "Projeto — Ateliê Cultural" }, { name: "description", content: "Construção guiada do projeto." }] }),
  component: ProjectPage,
});

function ProjectPage() {
  const { id } = Route.useParams();
  const { data } = useProject(id);
  const p = data as import("@/lib/data").Project | undefined;
  const { data: answers = [] } = useAnswers(id);
  const tpl = useTemplate(p?.template_ref);
  const upd = useUpdateProject(id);
  const [step, setStep] = useState(0);
  const [showFull, setShowFull] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Perguntas");

  if (!p || !tpl) return <p className="text-muted-foreground">Carregando…</p>;
  const sections = sectionsOf(tpl.fields);
  const fields = tpl.fields.filter((f) => f.section === sections[step]);
  const get = (k: string) => answers.find((a) => a.field_key === k)?.content ?? "";

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow={tpl.name} title={p.name}>
        <Button
          variant="outline"
          onClick={() => {
            const n = window.prompt("Novo nome do projeto", p.name)?.trim();
            if (n && n !== p.name) upd.mutate({ name: n });
          }}
        >
          Renomear
        </Button>
        <select className="h-9 rounded-sm border border-input bg-paper px-2 text-sm" value={p.status} onChange={(e) => upd.mutate({ status: e.target.value })}>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <Button variant="outline" onClick={() => setShowFull(!showFull)}>{showFull ? "Voltar às perguntas" : "Ver projeto completo"}</Button>
      </PageHeader>

      {!showFull && (
        <nav className="mb-8 flex flex-wrap gap-4 border-b border-border">
          {TABS.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 pb-2 text-sm ${tab === t ? "border-primary font-medium" : "border-transparent text-muted-foreground"}`}>{t}</button>
          ))}
        </nav>
      )}
      {!showFull && tab === "Orçamento" ? <BudgetTab projectId={id} />
      : !showFull && tab === "Cronograma" ? <ScheduleTab projectId={id} />
      : !showFull && tab === "Equipe" ? <TeamTab projectId={id} />
      : !showFull && tab === "Acessibilidade" ? <AccessibilityTab project={p} />
      : !showFull && tab === "Democratização" ? <DemocratizationTab project={p} />
      : !showFull && tab === "Documentos" ? <DocumentsTab projectId={id} />
      : !showFull && tab === "Verificação" ? <VerifyTab project={p} template={tpl} answers={answers} />
      : !showFull && tab === "Exportar" ? <ExportTab project={p} template={tpl} answers={answers} />
      : !showFull && tab === "Colaboração" ? <ShareTab project={p} />
      : showFull ? (
        <div className="space-y-6">
          {tpl.fields.map((f) => (
            <div key={f.key} className="border-b border-border pb-4">
              <p className="eyebrow">{f.section}</p>
              <h3 className="text-lg">{f.label}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">{get(f.key) || <span className="text-muted-foreground">— sem resposta —</span>}</p>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="mb-8 flex flex-wrap gap-1">
            {sections.map((s, i) => (
              <button key={s} onClick={() => setStep(i)} className={`border px-3 py-1.5 text-xs ${i === step ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                {i + 1}. {s}
              </button>
            ))}
          </div>
          <div className="space-y-10">
            {fields.map((f) => <FieldEditor key={f.key} projectId={id} field={f} initial={get(f.key)} />)}
          </div>
          <div className="mt-10 flex justify-between">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>← Etapa anterior</Button>
            <Button disabled={step === sections.length - 1} onClick={() => setStep(step + 1)}>Próxima etapa →</Button>
          </div>
        </>
      )}
      <p className="mt-12 text-xs text-muted-foreground"><Link to="/projetos" className="underline">Voltar aos projetos</Link></p>
    </div>
  );
}

function FieldEditor({ projectId, field, initial }: { projectId: string; field: TemplateField; initial: string }) {
  const [v, setV] = useState(initial);
  const [ex, setEx] = useState(false);
  const [state, setState] = useState<"" | "salvando" | "salvo">("");
  const t = useRef<ReturnType<typeof setTimeout>>(undefined);
  const qc = useQueryClient();
  useEffect(() => setV(initial), [initial]);

  function change(val: string) {
    setV(val);
    setState("salvando");
    clearTimeout(t.current);
    t.current = setTimeout(async () => {
      await saveAnswer(projectId, field.key, val);
      qc.invalidateQueries({ queryKey: ["answers"] });
      setState("salvo");
    }, 800);
  }

  const over = field.maxChars && v.length > field.maxChars;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-xl">{field.label}{field.required && <span className="text-terra"> *</span>}</h3>
        {field.example && <button className="shrink-0 text-xs underline" onClick={() => setEx(!ex)}>{ex ? "Fechar exemplo" : "Ver exemplo"}</button>}
      </div>
      {field.guidance && <p className="mt-1 text-sm text-muted-foreground">{field.guidance}</p>}
      {ex && field.example && (
        <div className="mt-3 border-l-2 border-terra bg-paper p-4 text-sm">
          <p className="eyebrow">Exemplo fictício — apenas referência</p>
          <p className="mt-2 whitespace-pre-wrap italic">{field.example.text}</p>
          <p className="mt-2"><b>Por que funciona:</b> {field.example.why}</p>
          {field.example.pitfalls && <p className="mt-1"><b>Erro comum:</b> {field.example.pitfalls}</p>}
        </div>
      )}
      {field.kind === "short" ? (
        <Input className="mt-3 bg-paper" value={v} onChange={(e) => change(e.target.value)} />
      ) : (
        <Textarea className="mt-3 min-h-32 bg-paper" value={v} onChange={(e) => change(e.target.value)} placeholder={field.kind === "link" ? "Você pode responder aqui; o detalhamento estruturado virá na aba correspondente." : ""} />
      )}
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{state === "salvando" ? "Salvando…" : state === "salvo" ? "Salvo" : ""}</span>
        <span className={over ? "text-destructive" : ""}>{v.length}{field.maxChars ? ` / ${field.maxChars}` : ""} caracteres</span>
      </div>
    </div>
  );
}
