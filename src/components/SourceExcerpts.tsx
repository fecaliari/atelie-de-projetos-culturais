import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { excerptsOfSource } from "@/lib/library";

/** Trechos importantes da fonte, sempre com a origem (página, artigo, minuto do vídeo). Entram na verificação do projeto. */
export function SourceExcerpts({ sourceId }: { sourceId: string }) {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery(excerptsOfSource(sourceId));
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [busy, setBusy] = useState(false);
  async function add() {
    if (!excerpt.trim()) { toast.error("Cole o trecho."); return; }
    setBusy(true);
    const r = await supabase.from("source_excerpts").insert({ source_id: sourceId, label: label.trim(), location: location.trim(), excerpt: excerpt.trim() });
    setBusy(false);
    if (r.error) { toast.error("Não foi possível guardar o trecho."); return; }
    setLabel(""); setLocation(""); setExcerpt("");
    await qc.invalidateQueries({ queryKey: ["excerpts", sourceId] });
  }
  async function remove(id: string) {
    const r = await supabase.from("source_excerpts").delete().eq("id", id);
    if (r.error) { toast.error("Não foi possível apagar o trecho."); return; }
    await qc.invalidateQueries({ queryKey: ["excerpts", sourceId] });
  }
  return <section className="mt-8 border-t border-border pt-5">
    <p className="eyebrow">trechos e origem</p>
    <p className="mt-1 text-sm text-muted-foreground">Guarde aqui o que importa (um valor, um prazo, uma regra), copiado do original e com a página ou o artigo de onde veio. Esses trechos vão junto quando você prepara a verificação de um projeto.</p>
    {!!items.length && <ul className="mt-4 divide-y divide-border">{items.map(e => <li key={e.id} className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0"><p className="text-xs text-muted-foreground">{[e.label, e.location].filter(Boolean).join(" · ") || "sem rótulo"}</p><p className="mt-1 whitespace-pre-wrap text-sm">“{e.excerpt}”</p></div>
      <Button variant="ghost" size="sm" aria-label="Apagar trecho" onClick={() => void remove(e.id)}><Trash2 className="size-4" /></Button>
    </li>)}</ul>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="block text-sm">Sobre o quê<Input className="mt-2 bg-paper" maxLength={120} placeholder="Valor máximo, prazo, documentos…" value={label} onChange={e => setLabel(e.target.value)} /></label>
      <label className="block text-sm">Onde está no original<Input className="mt-2 bg-paper" maxLength={120} placeholder="p. 12, art. 5º, 03:40 do vídeo…" value={location} onChange={e => setLocation(e.target.value)} /></label>
    </div>
    <label className="mt-3 block text-sm">Trecho copiado do original<Textarea className="mt-2 min-h-24 bg-paper" maxLength={5000} value={excerpt} onChange={e => setExcerpt(e.target.value)} /></label>
    <Button className="mt-3" variant="outline" onClick={() => void add()} disabled={busy || !excerpt.trim()}><Plus className="size-4" />Guardar trecho</Button>
  </section>;
}
