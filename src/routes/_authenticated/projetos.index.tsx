import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Archive } from "lucide-react";
import { PageHeader } from "@/components/AppShell";
import { duplicateProject, useProjects } from "@/lib/data";
import { LANGUAGES, STATUSES, statusLabel } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/projetos/")({
  head: () => ({ meta: [{ title: "Meus projetos — Ateliê Cultural" }, { name: "description", content: "Todos os seus projetos culturais." }] }),
  component: Projetos,
});

function Projetos() {
  const { data = [], isLoading } = useProjects();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState("ativos");
  const [lang, setLang] = useState("");
  const [q, setQ] = useState("");

  const list = data.filter(
    (p) =>
      (status === "ativos" ? p.status !== "arquivado" : status === "todos" || p.status === status) &&
      (!lang || p.languages.includes(lang)) &&
      (!q || p.name.toLowerCase().includes(q.toLowerCase())),
  );

  async function dup(p: (typeof data)[number]) {
    const c = await duplicateProject(p);
    qc.invalidateQueries({ queryKey: ["projects"] });
    toast.success("Projeto duplicado");
    navigate({ to: "/projetos/$id", params: { id: c.id } });
  }
  async function archive(id: string) {
    await supabase.from("projects").update({ status: "arquivado" }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["projects"] });
    toast.success("Projeto arquivado");
  }

  const sel = "h-9 rounded-sm border border-input bg-paper px-2 text-sm";
  return (
    <div>
      <PageHeader eyebrow="Arquivo" title="Meus projetos">
        <Button asChild><Link to="/projetos/novo">Novo projeto</Link></Button>
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2">
        <Input placeholder="Buscar pelo nome" value={q} onChange={(e) => setQ(e.target.value)} className="h-9 max-w-xs" />
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ativos">Ativos</option>
          <option value="todos">Todos</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className={sel} value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">Todas as linguagens</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Carregando…</p> : list.length === 0 ? (
        <p className="py-16 text-center font-serif text-2xl font-light text-muted-foreground">Nenhum projeto por aqui.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((p) => (
            <li key={p.id} className="grid items-center gap-2 py-5 md:grid-cols-12">
              <Link to="/projetos/$id" params={{ id: p.id }} className="md:col-span-6">
                <span className="font-serif text-xl hover:underline">{p.name}</span>
                {p.summary && <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{p.summary}</p>}
              </Link>
              <div className="text-sm text-muted-foreground md:col-span-3">{p.languages.join(", ") || "—"}<br /><span className="text-xs">{p.mechanism || "Sem mecanismo"}</span></div>
              <span className="eyebrow md:col-span-2">{statusLabel(p.status)}</span>
              <div className="flex gap-1 md:col-span-1 md:justify-end">
                <Button size="icon" variant="ghost" title="Duplicar" onClick={() => dup(p)}><Copy className="h-4 w-4" /></Button>
                {p.status !== "arquivado" && <Button size="icon" variant="ghost" title="Arquivar" onClick={() => archive(p.id)}><Archive className="h-4 w-4" /></Button>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
