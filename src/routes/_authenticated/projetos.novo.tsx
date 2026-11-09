import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { LANGUAGES, PROPONENT_TYPES } from "@/lib/constants";
import { BUILTIN_TEMPLATES } from "@/lib/templates";
import { customToTemplate, useCustomTemplates } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LanguagePicker } from "@/components/project/LanguagePicker";

export const Route = createFileRoute("/_authenticated/projetos/novo")({
  head: () => ({ meta: [{ title: "Novo projeto — Ateliê Cultural" }, { name: "description", content: "Comece um novo projeto cultural." }, { property: "og:title", content: "Novo projeto — Ateliê Cultural" }, { property: "og:description", content: "Comece um novo projeto cultural." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Novo,
});

function Novo() {
  const navigate = useNavigate();
  const { data: custom = [] } = useCustomTemplates();
  const templates = [...BUILTIN_TEMPLATES, ...custom.map(customToTemplate)];
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [proponent, setProponent] = useState("");
  const [ref, setRef] = useState("builtin:generico");
  const [busy, setBusy] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const t = templates.find((x) => x.ref === ref)!;
    const { data, error } = await supabase
      .from("projects")
      .insert({ name, summary, languages, proponent_type: proponent || null, template_ref: ref, mechanism: t.mechanism, status: "estruturacao" })
      .select()
      .single();
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (name.trim()) await supabase.from("answers").insert([
      { project_id: data.id, field_key: t.fields[0]?.key ?? "nome", content: t.fields[0]?.kind === "short" ? name : "" },
    ]);
    navigate({ to: "/projetos/$id", params: { id: data.id } });
  }

  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow="Novo projeto" title="Uma ideia por vez" />
      <form onSubmit={create} className="space-y-8">
        <div className="space-y-1.5">
          <Label>Nome provisório</Label>
          <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Como você chama essa ideia?" />
        </div>
        <div className="space-y-1.5">
          <Label>Em uma frase, do que se trata?</Label>
          <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
        </div>
        <div className="space-y-2">
          <Label>Linguagens</Label>
          <LanguagePicker value={languages} onChange={setLanguages} options={LANGUAGES} />
        </div>
        <div className="space-y-1.5">
          <Label>Tipo de proponente</Label>
          <select className="h-9 w-full rounded-sm border border-input bg-paper px-2 text-sm" value={proponent} onChange={(e) => setProponent(e.target.value)}>
            <option value="">Ainda não sei</option>
            {PROPONENT_TYPES.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Edital ou mecanismo</Label>
          <div className="grid gap-2">
            {templates.map((t) => (
              <label key={t.ref} className={`flex cursor-pointer gap-3 border p-4 ${ref === t.ref ? "border-primary bg-accent/40" : "border-border"}`}>
                <input type="radio" name="tpl" checked={ref === t.ref} onChange={() => setRef(t.ref)} className="mt-1 accent-primary" />
                <span>
                  <span className="font-serif text-lg">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">{t.fields.length} campos · {t.mechanism}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">Edital com exigências próprias? Crie um modelo em “Modelos de edital” e adicione os campos.</p>
        </div>
        <Button type="submit" disabled={busy}>Começar a construção</Button>
      </form>
    </div>
  );
}
