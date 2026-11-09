import { useState } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Search, ArrowLeft, ExternalLink, FileText, Link as LinkIcon, Film, BookOpen, Trash2, Sparkles, Check, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { libraryQuery, SOURCE_KINDS, extractSourceFile, publicLink, type Library, type Source } from "@/lib/library";
import { readLibrarySource } from "@/lib/library.functions";

const ICONS = { arquivo: FileText, link: LinkIcon, video: Film, texto: BookOpen };
type Draft = { title: string; kind: Source["kind"]; url: string; content: string; notes: string; analysis: string; reviewed: boolean };
const fresh = (): Draft => ({ title: "", kind: "arquivo", url: "", content: "", notes: "", analysis: "", reviewed: false });

export function LibraryPage({ library }: { library: Library }) {
  const { data: sources } = useSuspenseQuery(libraryQuery(library));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("todos");
  const [selection, setSelection] = useState<Source | "new" | null>(null);
  const title = library === "editais" ? "biblioteca de editais" : "biblioteca de referências";
  if (selection) return <SourceEditor key={typeof selection === "string" ? "new" : selection.id} source={selection === "new" ? null : selection} library={library} onClose={() => setSelection(null)} onSaved={setSelection} />;
  const visible = sources.filter(s => (filter === "todos" || s.kind === filter) && `${s.title} ${s.notes}`.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  return <div className="max-w-5xl">
    <PageHeader eyebrow="Acervo" title={title}><Button onClick={() => setSelection("new")}><Plus className="size-4" />Adicionar fonte</Button></PageHeader>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div className="relative w-full sm:w-80"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input aria-label="Buscar fontes" className="bg-paper pl-9" placeholder="Buscar no acervo" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <select aria-label="Tipo de fonte" className="h-9 rounded-sm border border-input bg-paper px-3 text-sm" value={filter} onChange={e => setFilter(e.target.value)}><option value="todos">Todos os tipos</option>{Object.entries(SOURCE_KINDS).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select>
    </div>
    <div className="mb-3 flex items-baseline justify-between border-b border-border pb-3"><span className="eyebrow">fontes guardadas</span><span className="text-sm text-muted-foreground">{visible.length} {visible.length === 1 ? "fonte" : "fontes"}</span></div>
    {!visible.length ? <div className="py-16 text-center"><BookOpen className="mx-auto mb-4 size-9 text-primary" /><h2 className="text-lg">{sources.length ? "nenhuma fonte encontrada" : "seu acervo começa aqui"}</h2><p className="mt-2 text-sm text-muted-foreground">{sources.length ? "Nenhum resultado para esta busca." : "Nenhuma fonte adicionada ainda."}</p>{!sources.length && <Button variant="outline" className="mt-6" onClick={() => setSelection("new")}><Plus className="size-4" />Adicionar fonte</Button>}</div> : <ul className="divide-y divide-border">{visible.map(source => {
      const Icon = ICONS[source.kind as keyof typeof ICONS] ?? FileText;
      return <li key={source.id} className="flex items-center gap-4 py-5"><Icon className="size-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><Button variant="link" className="h-auto max-w-full whitespace-normal p-0 text-left text-base text-foreground" onClick={() => setSelection(source)}>{source.title}</Button><p className="mt-1 text-xs text-muted-foreground">{SOURCE_KINDS[source.kind as keyof typeof SOURCE_KINDS]} · {source.reviewed ? "Leitura revisada" : source.analysis ? "Leitura pendente de revisão" : "Sem leitura"}</p>{source.notes && <p className="mt-2 line-clamp-1 text-sm text-muted-foreground">{source.notes}</p>}</div><Button variant="outline" size="sm" onClick={() => setSelection(source)}>Abrir</Button></li>;
    })}</ul>}
  </div>;
}

function SourceEditor({ source, library, onClose, onSaved }: { source: Source | null; library: Library; onClose: () => void; onSaved: (source: Source) => void }) {
  const qc = useQueryClient();
  const readSource = useServerFn(readLibrarySource);
  const [draft, setDraft] = useState<Draft>(source ? { title: source.title, kind: source.kind, url: source.url ?? "", content: source.content, notes: source.notes, analysis: source.analysis, reviewed: source.reviewed } : fresh());
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  function update(patch: Partial<Draft>) { setDraft(d => ({ ...d, ...patch })); setDirty(true); }
  function back() { if (!dirty || window.confirm("Sair sem salvar as alterações?")) onClose(); }
  async function selectFile(selected?: File) {
    if (!selected) return;
    setExtracting(true); setError("");
    try {
      const content = await extractSourceFile(selected);
      setFile(selected);
      update({ content, title: draft.title || selected.name.replace(/\.[^.]+$/, ""), reviewed: false });
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível ler o arquivo."); }
    finally { setExtracting(false); }
  }
  async function save() {
    setBusy(true); setError("");
    let uploaded: string | null = null;
    try {
      if (!draft.title.trim()) throw new Error("Informe o título da fonte.");
      if ((draft.kind === "link" || draft.kind === "video") && !draft.url.trim()) throw new Error("Informe o link da fonte.");
      const url = draft.url.trim() ? publicLink(draft.url.trim()) : null;
      if (draft.kind === "arquivo" && !file && !source?.file_path) throw new Error("Escolha um arquivo.");
      let path = source?.file_path ?? null;
      if (file) {
        const auth = await supabase.auth.getUser();
        if (!auth.data.user) throw new Error("Entre novamente para salvar a fonte.");
        path = `${auth.data.user.id}/${crypto.randomUUID()}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const upload = await supabase.storage.from("library-files").upload(path, file);
        if (upload.error) throw new Error(upload.error.message);
        uploaded = path;
      }
      const patch = { ...draft, title: draft.title.trim(), library, url, file_path: path, file_name: file?.name ?? source?.file_name ?? null, updated_at: new Date().toISOString() };
      const result = source ? await supabase.from("library_sources").update(patch).eq("id", source.id).select().single() : await supabase.from("library_sources").insert(patch).select().single();
      if (result.error) throw new Error(result.error.message);
      if (uploaded && source?.file_path && source.file_path !== uploaded) await supabase.storage.from("library-files").remove([source.file_path]);
      setDirty(false); setFile(null); toast.success("Fonte salva");
      await qc.invalidateQueries({ queryKey: ["library", library] });
      onSaved(result.data);
    } catch (err) {
      if (uploaded) await supabase.storage.from("library-files").remove([uploaded]);
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally { setBusy(false); }
  }
  async function analyze() {
    if (!source || dirty) { setError("Salve as alterações antes de solicitar a leitura."); return; }
    setReading(true); setError("");
    try {
      const result = await readSource({ data: { id: source.id } });
      if (result.error || !result.analysis) throw new Error(result.error ?? "Leitura indisponível.");
      update({ analysis: result.analysis, reviewed: false });
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível concluir a leitura."); }
    finally { setReading(false); }
  }
  async function openOriginal() {
    if (source?.file_path) {
      const result = await supabase.storage.from("library-files").createSignedUrl(source.file_path, 120);
      if (result.error) { setError("Não foi possível abrir o arquivo."); return; }
      window.open(result.data.signedUrl, "_blank", "noopener,noreferrer");
    } else if (draft.url) window.open(publicLink(draft.url), "_blank", "noopener,noreferrer");
  }
  async function remove() {
    if (!source || !window.confirm(`Apagar a fonte “${source.title}” e seu arquivo?`)) return;
    setBusy(true);
    const result = await supabase.from("library_sources").delete().eq("id", source.id);
    if (result.error) { setError("Não foi possível apagar a fonte."); setBusy(false); return; }
    if (source.file_path) await supabase.storage.from("library-files").remove([source.file_path]);
    await qc.invalidateQueries({ queryKey: ["library", library] });
    toast.success("Fonte apagada"); onClose();
  }
  const locked = busy || reading || extracting;
  return <div className="max-w-5xl">
    <PageHeader eyebrow={library === "editais" ? "Editais" : "Referências"} title={source ? "fonte do acervo" : "adicionar fonte"}>
      <Button variant="outline" onClick={back} disabled={locked}><ArrowLeft className="size-4" />Voltar</Button><Button onClick={save} disabled={locked}><Save className="size-4" />{busy ? "Salvando…" : "Salvar fonte"}</Button>
    </PageHeader>
    {error && <p role="alert" className="mb-5 border-l-2 border-destructive bg-muted px-4 py-3 text-sm text-destructive">{error}</p>}
    <fieldset disabled={locked} className="min-w-0 space-y-5">
      <label className="block text-sm">Título da fonte<Input className="mt-2 bg-paper" value={draft.title} onChange={e => update({ title: e.target.value })} /></label>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Formato da fonte">{Object.entries(SOURCE_KINDS).map(([kind,label]) => { const Icon = ICONS[kind as keyof typeof ICONS]; return <Button key={kind} variant={draft.kind === kind ? "default" : "outline"} aria-pressed={draft.kind === kind} onClick={() => update({ kind, reviewed: false })}><Icon className="size-4" />{label}</Button>; })}</div>
      {draft.kind === "arquivo" && <label className="block text-sm">Arquivo (PDF, Word ou texto; até 10 MB)<Input className="mt-2 bg-paper" type="file" accept=".pdf,.docx,.txt,.md" onChange={e => void selectFile(e.target.files?.[0])} />{(file?.name || source?.file_name) && <span className="mt-2 block text-xs text-muted-foreground">{file?.name ?? source?.file_name}</span>}</label>}
      {(draft.kind === "link" || draft.kind === "video") && <label className="block text-sm">Link<Input className="mt-2 bg-paper" type="url" placeholder="https://" value={draft.url} onChange={e => update({ url: e.target.value })} /></label>}
      <label className="block text-sm">{draft.kind === "video" ? "Transcrição do vídeo" : draft.kind === "link" ? "Texto da página" : "Texto da fonte"}<Textarea className="mt-2 min-h-56 bg-paper" value={draft.content} onChange={e => update({ content: e.target.value, reviewed: false })} placeholder={draft.kind === "link" || draft.kind === "video" ? "Cole o conteúdo que deseja analisar" : "Texto da fonte"} /><span className="mt-2 block text-xs text-muted-foreground">{draft.content.length.toLocaleString("pt-BR")} caracteres{extracting ? " · Lendo arquivo…" : ""}</span></label>
      <label className="block text-sm">Anotações<Textarea className="mt-2 min-h-24 bg-paper" value={draft.notes} onChange={e => update({ notes: e.target.value })} /></label>
    </fieldset>
    <section className="mt-10 border-t-2 border-primary pt-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl text-primary">leitura da fonte</h2><div className="flex flex-wrap gap-2">{(source?.file_path || draft.url) && <Button variant="outline" onClick={openOriginal} disabled={locked}><ExternalLink className="size-4" />Original</Button>}<Button variant="outline" onClick={analyze} disabled={locked || !source || dirty || !draft.content.trim()}>{reading ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Sparkles className="size-4" />}{reading ? "Lendo fonte…" : "Ler com IA"}</Button></div></div>
      <label className="block text-sm">Leitura preliminar — conferir no original<Textarea aria-label="Leitura preliminar" className="mt-2 min-h-64 bg-paper" value={draft.analysis} onChange={e => update({ analysis: e.target.value, reviewed: false })} disabled={locked} /></label>
      <label className="mt-4 flex items-start gap-2 text-sm"><input className="mt-1 accent-primary" type="checkbox" checked={draft.reviewed} disabled={locked || !draft.analysis.trim()} onChange={e => update({ reviewed: e.target.checked })} /><Check className="mt-0.5 size-4 shrink-0 text-primary" />Conferi esta leitura com a fonte original</label>
    </section>
    <div className="mt-8 flex flex-wrap justify-between gap-4 border-t border-border pt-5">{source ? <Button variant="ghost" className="text-destructive" onClick={remove} disabled={locked}><Trash2 className="size-4" />Apagar fonte</Button> : <span />}<Button onClick={save} disabled={locked}><Save className="size-4" />Salvar fonte</Button></div>
  </div>;
}