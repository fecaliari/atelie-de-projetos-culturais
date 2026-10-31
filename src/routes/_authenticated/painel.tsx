import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";
import { useAllAnswers, useProjects } from "@/lib/data";
import { DONE, DRAFTING, IN_PROGRESS, statusLabel } from "@/lib/constants";
import { builtinTemplate } from "@/lib/templates";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({ meta: [{ title: "Visão geral — Ateliê Cultural" }, { name: "description", content: "Painel de trabalho dos seus projetos culturais." }] }),
  component: Painel,
});

function Painel() {
  const { data: projects = [] } = useProjects();
  const { data: answers = [] } = useAllAnswers();
  const active = projects.filter((p) => p.status !== "arquivado");
  const recent = [...active].sort((a, b) => b.last_opened_at.localeCompare(a.last_opened_at)).slice(0, 5);

  const pend = active
    .map((p) => {
      const t = builtinTemplate(p.template_ref);
      if (!t) return null;
      const req = t.fields.filter((f) => f.required && f.kind !== "link");
      const filled = new Set(answers.filter((a) => a.project_id === p.id && a.content.trim()).map((a) => a.field_key));
      const missing = req.filter((f) => !filled.has(f.key));
      return missing.length ? { p, missing } : null;
    })
    .filter(Boolean) as { p: (typeof active)[number]; missing: { label: string }[] }[];

  const col = (title: string, list: typeof active) => (
    <div className="border-t border-foreground/70 pt-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xl">{title}</h2>
        <span className="font-serif text-3xl font-light text-terra">{list.length}</span>
      </div>
      <ul className="mt-3 space-y-1.5 text-sm">
        {list.slice(0, 4).map((p) => (
          <li key={p.id}><Link to="/projetos/$id" params={{ id: p.id }} className="hover:underline">{p.name}</Link></li>
        ))}
      </ul>
    </div>
  );

  return (
    <div>
      <PageHeader eyebrow="Visão geral" title="Mesa de trabalho">
        <Button asChild><Link to="/projetos/novo">Novo projeto</Link></Button>
        <Button asChild variant="outline"><Link to="/modelos">Modelos de edital</Link></Button>
      </PageHeader>

      <div className="grid gap-8 md:grid-cols-3">
        {col("Em elaboração", active.filter((p) => DRAFTING.includes(p.status)))}
        {col("Em andamento", active.filter((p) => IN_PROGRESS.includes(p.status)))}
        {col("Finalizados", active.filter((p) => DONE.includes(p.status)))}
      </div>

      <div className="mt-14 grid gap-10 md:grid-cols-12">
        <section className="md:col-span-7">
          <p className="eyebrow">Últimos acessados</p>
          {recent.length === 0 ? (
            <div className="mt-4 border border-dashed border-border p-8 text-center">
              <p className="font-serif text-2xl font-light">Nenhum projeto ainda.</p>
              <p className="mt-2 text-sm text-muted-foreground">Comece por uma ideia — as perguntas fazem o resto.</p>
              <Button asChild className="mt-4"><Link to="/projetos/novo">Criar primeiro projeto</Link></Button>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-border border-y border-border">
              {recent.map((p) => (
                <li key={p.id}>
                  <Link to="/projetos/$id" params={{ id: p.id }} className="flex items-baseline justify-between gap-4 py-4 hover:bg-paper">
                    <span className="font-serif text-lg">{p.name}</span>
                    <span className="eyebrow shrink-0">{statusLabel(p.status)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="md:col-span-5">
          <p className="eyebrow">Pendências</p>
          {pend.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Nenhum campo obrigatório em aberto.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {pend.slice(0, 6).map(({ p, missing }) => (
                <li key={p.id} className="border-l-2 border-terra pl-4">
                  <Link to="/projetos/$id" params={{ id: p.id }} className="font-medium hover:underline">{p.name}</Link>
                  <p className="text-sm text-muted-foreground">{missing.length} campo(s) obrigatório(s) sem resposta — ex.: {missing[0]?.label}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-10 border border-border bg-paper p-5 text-sm">
            <p className="eyebrow">Em breve</p>
            <p className="mt-2 text-muted-foreground">Oportunidades recentes, editais perto do encerramento e fontes adicionadas aparecerão aqui com o Radar e as Bibliotecas.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
