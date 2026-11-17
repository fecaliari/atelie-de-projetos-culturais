import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { libraryQuery, linksOfProject, SPHERES, deadlineLabel, type Library, type Source } from "@/lib/library";

function Block({ projectId, library, title, hint, empty }: { projectId: string; library: Library; title: string; hint: string; empty: string }) {
  const qc = useQueryClient();
  const { data: sources = [] } = useQuery(libraryQuery(library));
  const { data: links = [] } = useQuery(linksOfProject(projectId));
  const [pick, setPick] = useState("");
  const byId = new Map(sources.map(s => [s.id, s]));
  const linked = links.map(l => ({ link: l, source: byId.get(l.source_id) })).filter((x): x is { link: typeof links[number]; source: Source } => !!x.source);
  const free = sources.filter(s => !links.some(l => l.source_id === s.id));
  async function add() {
    if (!pick) return;
    const r = await supabase.from("project_sources").insert({ project_id: projectId, source_id: pick });
    if (r.error) { toast.error("Não foi possível ligar a fonte."); return; }
    setPick(""); await qc.invalidateQueries({ queryKey: ["project-sources", projectId] }); await qc.invalidateQueries({ queryKey: ["source-projects", pick] });
  }
  async function remove(id: string, sourceId: string) {
    const r = await supabase.from("project_sources").delete().eq("id", id);
    if (r.error) { toast.error("Não foi possível desligar a fonte."); return; }
    await qc.invalidateQueries({ queryKey: ["project-sources", projectId] }); await qc.invalidateQueries({ queryKey: ["source-projects", sourceId] });
  }
  return <section>
    <p className="eyebrow">{title}</p>
    <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    {!linked.length ? <p className="mt-4 text-sm text-muted-foreground">{empty}</p> : <ul className="mt-4 divide-y divide-border">{linked.map(({ link, source }) => <li key={link.id} className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0"><p>{source.title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{[source.sphere ? SPHERES[source.sphere as keyof typeof SPHERES] : "", source.year ?? "", source.organ, source.deadline ? deadlineLabel(source.deadline) : "", source.reviewed ? "leitura revisada" : source.analysis ? "leitura pendente de revisão" : "sem leitura"].filter(Boolean).join(" · ")}</p></div>
      <Button variant="ghost" size="sm" aria-label={`Desligar ${source.title}`} onClick={() => void remove(link.id, source.id)}><Trash2 className="size-4" /></Button>
    </li>)}</ul>}
    <div className="mt-4 flex flex-wrap gap-2">
      <select aria-label={`Escolher em ${title}`} className="h-9 min-w-0 flex-1 rounded-sm border border-input bg-paper px-3 text-sm sm:max-w-md" value={pick} onChange={e => setPick(e.target.value)} disabled={!free.length}>
        <option value="">{free.length ? "Escolher da biblioteca…" : sources.length ? "Tudo já está ligado" : "A biblioteca está vazia"}</option>
        {free.map(s => <option key={s.id} value={s.id}>{s.title}{s.year ? ` (${s.year})` : ""}</option>)}
      </select>
      <Button variant="outline" onClick={() => void add()} disabled={!pick}><Plus className="size-4" />Ligar</Button>
    </div>
  </section>;
}

export function SourcesTab({ projectId }: { projectId: string }) {
  return <div className="space-y-10">
    <Block projectId={projectId} library="editais" title="Edital de destino" hint="Em qual edital este projeto vai concorrer. A verificação com IA passa a levar as regras do edital junto." empty="Nenhum edital ligado ainda." />
    <Block projectId={projectId} library="referencias" title="Referências usadas" hint="Materiais da sua biblioteca que embasam este projeto." empty="Nenhuma referência ligada ainda." />
  </div>;
}
