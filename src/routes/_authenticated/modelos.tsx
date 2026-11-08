import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/AppShell";
import { useCustomTemplates, type CustomTemplate } from "@/lib/data";
import { BUILTIN_TEMPLATES, builtinTemplate, sectionsOf, slugKey, type FieldKind, type TemplateField } from "@/lib/templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/modelos")({
  head: () => ({
    meta: [
      { title: "Modelos de edital — Ateliê Cultural" },
      { name: "description", content: "Crie modelos a partir do Funcultura ou da Rouanet e adicione campos próprios de cada edital." },
      { property: "og:title", content: "Modelos de edital — Ateliê Cultural" },
      { property: "og:description", content: "Modelos de perguntas com campos próprios de cada edital." },
    ],
  }),
  component: TemplatesPage,
});

const KINDS: { value: FieldKind; label: string }[] = [
  { value: "long", label: "Texto longo" },
  { value: "short", label: "Texto curto" },
];

function TemplatesPage() {
  const qc = useQueryClient();
  const { data: list = [] } = useCustomTemplates();
  const [editing, setEditing] = useState<CustomTemplate | null>(null);
  const [base, setBase] = useState(BUILTIN_TEMPLATES[1]?.ref ?? "builtin:generico");

  async function create() {
    const b = builtinTemplate(base)!;
    const r = await supabase
      .from("templates")
      .insert({ name: `${b.name} — cópia`, mechanism: b.mechanism, base_key: b.ref, fields: b.fields as never })
      .select()
      .single();
    if (r.error) return toast.error(r.error.message);
    qc.invalidateQueries({ queryKey: ["templates"] });
    setEditing(r.data);
  }
  async function remove(t: CustomTemplate) {
    if (!window.confirm(`Apagar o modelo "${t.name}"? Projetos que usam este modelo deixam de mostrar as perguntas.`)) return;
    await supabase.from("templates").delete().eq("id", t.id);
    qc.invalidateQueries({ queryKey: ["templates"] });
  }

  if (editing) return <Editor tpl={editing} onClose={() => { setEditing(null); qc.invalidateQueries({ queryKey: ["templates"] }); }} />;

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Modelos" title="Modelos de edital" />
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Cada edital tem exigências próprias. Parta de um roteiro pronto e adicione, edite, reordene ou remova campos. Depois, escolha o modelo ao criar um projeto.
      </p>
      <div className="mb-10 flex flex-wrap items-center gap-2">
        <select className="h-9 rounded-sm border border-input bg-paper px-2 text-sm" value={base} onChange={(e) => setBase(e.target.value)}>
          {BUILTIN_TEMPLATES.map((t) => <option key={t.ref} value={t.ref}>{t.name}</option>)}
        </select>
        <Button onClick={create}>Criar modelo a partir deste</Button>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-muted-foreground">Você ainda não criou modelos.</p>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {list.map((t) => (
            <li key={t.id} className="flex items-center justify-between gap-4 py-4">
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.mechanism} · {(t.fields as unknown as TemplateField[]).length} campos</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setEditing(t)}>Editar</Button>
                <Button variant="ghost" onClick={() => remove(t)}>Apagar</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Editor({ tpl, onClose }: { tpl: CustomTemplate; onClose: () => void }) {
  const [name, setName] = useState(tpl.name);
  const [mechanism, setMechanism] = useState(tpl.mechanism ?? "");
  const [notes, setNotes] = useState(tpl.notes ?? "");
  const [fields, setFields] = useState<TemplateField[]>((tpl.fields as unknown as TemplateField[]) ?? []);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  useEffect(() => setDirty(true), [name, mechanism, notes, fields]);
  useEffect(() => setDirty(false), []);

  const sections = sectionsOf(fields);
  const set = (i: number, patch: Partial<TemplateField>) => setFields(fields.map((f, j) => (j === i ? { ...f, ...patch } : f)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= fields.length) return;
    const n = [...fields];
    [n[i], n[j]] = [n[j]!, n[i]!];
    setFields(n);
  };
  const add = () =>
    setFields([...fields, { key: slugKey("novo campo"), section: sections[sections.length - 1] ?? "Campos do edital", label: "Novo campo", kind: "long", required: false }]);

  async function save() {
    if (fields.some((f) => !f.label.trim() || !f.section.trim())) return toast.error("Todo campo precisa de título e etapa.");
    setSaving(true);
    const r = await supabase.from("templates").update({ name: name.trim() || "Modelo sem nome", mechanism, notes, fields: fields as never }).eq("id", tpl.id);
    setSaving(false);
    if (r.error) return toast.error(r.error.message);
    setDirty(false);
    toast.success("Modelo salvo");
  }

  return (
    <div className="max-w-4xl">
      <PageHeader eyebrow="Editar modelo" title={name || "Modelo"}>
        <Button variant="outline" onClick={() => { if (!dirty || window.confirm("Sair sem salvar?")) onClose(); }}>Voltar</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar modelo"}</Button>
      </PageHeader>
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <label className="text-sm">Nome do modelo<Input className="mt-1 bg-paper" value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="text-sm">Mecanismo / edital<Input className="mt-1 bg-paper" value={mechanism} onChange={(e) => setMechanism(e.target.value)} /></label>
        <label className="text-sm sm:col-span-2">Anotações sobre o edital<Textarea className="mt-1 bg-paper" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex.: número do edital, prazos, exigências específicas" /></label>
      </div>
      <datalist id="sections">{sections.map((s) => <option key={s} value={s} />)}</datalist>
      <ol className="space-y-4">
        {fields.map((f, i) => (
          <li key={f.key} className="border border-border bg-paper p-4">
            <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Campo {i + 1}</span>
              <span className="flex gap-3">
                <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Subir">↑ subir</button>
                <button onClick={() => move(i, 1)} disabled={i === fields.length - 1} aria-label="Descer">↓ descer</button>
                <button className="text-destructive" onClick={() => setFields(fields.filter((_, j) => j !== i))}>remover</button>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <label className="text-xs">Etapa<Input list="sections" className="mt-1" value={f.section} onChange={(e) => set(i, { section: e.target.value })} /></label>
              <label className="text-xs">Título / pergunta<Input className="mt-1" value={f.label} onChange={(e) => set(i, { label: e.target.value })} /></label>
            </div>
            <label className="mt-3 block text-xs">Orientação<Textarea className="mt-1 min-h-16" value={f.guidance ?? ""} onChange={(e) => set(i, { guidance: e.target.value || undefined })} /></label>
            <div className="mt-3 flex flex-wrap items-end gap-4 text-xs">
              <label>Limite de caracteres<Input type="number" min={0} className="mt-1 w-32" value={f.maxChars ?? ""} onChange={(e) => set(i, { maxChars: e.target.value ? Number(e.target.value) : null })} /></label>
              {f.kind !== "link" && (
                <label>Tipo
                  <select className="mt-1 block h-9 rounded-sm border border-input bg-background px-2" value={f.kind} onChange={(e) => set(i, { kind: e.target.value as FieldKind })}>
                    {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </label>
              )}
              <label className="flex items-center gap-2 pb-2"><input type="checkbox" checked={!!f.required} onChange={(e) => set(i, { required: e.target.checked })} /> Obrigatório</label>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6 flex justify-between">
        <Button variant="outline" onClick={add}>+ Adicionar campo</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Salvando…" : "Salvar modelo"}</Button>
      </div>
    </div>
  );
}
