import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/data";
import { useUpdateProject } from "@/lib/data";
import { ACCESSIBILITY_GROUPS, BUDGET_CATEGORIES, DEMOCRATIZATION_MEASURES, PHASES, brl } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type RowTable = "budget_items" | "schedule_items" | "team_members";
type Row = { id: string; position: number } & Partial<Record<"quantity" | "occurrences" | "unit_value", number>> &
  Partial<Record<"category" | "description" | "unit" | "phase" | "activity" | "start_date" | "end_date" | "duration" | "location" | "name" | "role" | "bio", string | null>>;

function useRows(table: RowTable, projectId: string) {
  const qc = useQueryClient();
  const key = [table, projectId];
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const r = await supabase.from(table).select("*").eq("project_id", projectId).order("position").order("created_at");
      if (r.error) throw new Error(r.error.message);
      return r.data as unknown as Row[];
    },
  });
  const done = () => qc.invalidateQueries({ queryKey: key });
  const add = useMutation({
    mutationFn: async (init: Record<string, unknown>) => {
      const r = await supabase.from(table).insert({ project_id: projectId, position: (q.data?.length ?? 0), ...init } as never);
      if (r.error) throw new Error(r.error.message);
    },
    onSuccess: done,
  });
  const update = async (id: string, patch: Record<string, unknown>) => {
    const r = await supabase.from(table).update(patch as never).eq("id", id);
    if (r.error) throw new Error(r.error.message);
    done();
  };
  const remove = async (id: string) => {
    await supabase.from(table).delete().eq("id", id);
    done();
  };
  return { rows: q.data ?? [], add, update, remove };
}

const cell = "h-9 w-full rounded-sm border border-input bg-paper px-2 text-sm";

function Txt({ v, onSave, type = "text", className = "" }: { v: unknown; onSave: (x: string) => void; type?: string; className?: string }) {
  return (
    <input
      type={type}
      step={type === "number" ? "any" : undefined}
      defaultValue={(v as string | number | null) ?? ""}
      onBlur={(e) => e.target.value !== String(v ?? "") && onSave(e.target.value)}
      className={`${cell} ${className}`}
    />
  );
}

export function BudgetTab({ projectId }: { projectId: string }) {
  const { rows, add, update, remove } = useRows("budget_items", projectId);
  const total = rows.reduce((s, r) => s + Number(r.quantity) * Number(r.occurrences) * Number(r.unit_value), 0);
  const byCat = BUDGET_CATEGORIES.map((c) => ({
    c,
    v: rows.filter((r) => r.category === c).reduce((s, r) => s + Number(r.quantity) * Number(r.occurrences) * Number(r.unit_value), 0),
  })).filter((x) => x.v > 0);
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">Total = quantidade × ocorrências × valor unitário. Os itens são salvos ao sair de cada campo.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr><th className="p-1">Categoria</th><th className="p-1">Descrição</th><th className="p-1">Unidade</th><th className="p-1 w-20">Qtd.</th><th className="p-1 w-20">Ocorr.</th><th className="p-1 w-28">Valor unit.</th><th className="p-1 w-28 text-right">Total</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="p-1">
                  <select className={cell} defaultValue={r.category as string} onChange={(e) => update(r.id, { category: e.target.value })}>
                    {BUDGET_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </td>
                <td className="p-1"><Txt v={r.description} onSave={(x) => update(r.id, { description: x })} /></td>
                <td className="p-1"><Txt v={r.unit} onSave={(x) => update(r.id, { unit: x })} /></td>
                <td className="p-1"><Txt type="number" v={r.quantity} onSave={(x) => update(r.id, { quantity: Number(x) || 0 })} /></td>
                <td className="p-1"><Txt type="number" v={r.occurrences} onSave={(x) => update(r.id, { occurrences: Number(x) || 0 })} /></td>
                <td className="p-1"><Txt type="number" v={r.unit_value} onSave={(x) => update(r.id, { unit_value: Number(x) || 0 })} /></td>
                <td className="p-1 text-right tabular-nums">{brl(Number(r.quantity) * Number(r.occurrences) * Number(r.unit_value))}</td>
                <td className="p-1"><button className="text-xs text-destructive underline" onClick={() => remove(r.id)}>Excluir</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button variant="outline" className="mt-3" onClick={() => add.mutate({ category: BUDGET_CATEGORIES[0], quantity: 1, occurrences: 1, unit: "un." })}>+ Adicionar item</Button>
      <div className="mt-8 border-t border-border pt-4">
        {byCat.map((x) => <p key={x.c} className="flex justify-between text-sm"><span>{x.c}</span><span className="tabular-nums">{brl(x.v)}</span></p>)}
        <p className="mt-2 flex justify-between text-lg"><span>Total do projeto</span><span className="tabular-nums">{brl(total)}</span></p>
      </div>
    </div>
  );
}

export function ScheduleTab({ projectId }: { projectId: string }) {
  const { rows, add, update, remove } = useRows("schedule_items", projectId);
  return (
    <div>
      {PHASES.map((ph) => (
        <section key={ph} className="mb-8">
          <h3 className="text-xl">{ph}</h3>
          <div className="mt-2 space-y-2">
            {rows.filter((r) => r.phase === ph).map((r) => (
              <div key={r.id} className="grid grid-cols-1 gap-2 border-b border-border pb-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]">
                <Txt v={r.activity} onSave={(x) => update(r.id, { activity: x })} />
                <Txt type="date" v={r.start_date} onSave={(x) => update(r.id, { start_date: x || null })} />
                <Txt type="date" v={r.end_date} onSave={(x) => update(r.id, { end_date: x || null })} />
                <Txt v={r.duration} onSave={(x) => update(r.id, { duration: x })} />
                <Txt v={r.location} onSave={(x) => update(r.id, { location: x })} />
                <button className="text-xs text-destructive underline" onClick={() => remove(r.id)}>Excluir</button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Colunas: atividade · início · fim · duração · local</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => add.mutate({ phase: ph })}>+ Atividade</Button>
        </section>
      ))}
    </div>
  );
}

export function TeamTab({ projectId }: { projectId: string }) {
  const { rows, add, update, remove } = useRows("team_members", projectId);
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.id} className="border border-border bg-paper p-4">
          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-xs">Nome<Txt v={r.name} onSave={(x) => update(r.id, { name: x })} /></label>
            <label className="text-xs">Função no projeto<Txt v={r.role} onSave={(x) => update(r.id, { role: x })} /></label>
          </div>
          <label className="mt-2 block text-xs">Minicurrículo
            <Textarea className="mt-1 bg-background" defaultValue={(r.bio as string) ?? ""} onBlur={(e) => update(r.id, { bio: e.target.value })} />
          </label>
          <button className="mt-2 text-xs text-destructive underline" onClick={() => remove(r.id)}>Remover pessoa</button>
        </div>
      ))}
      <Button variant="outline" onClick={() => add.mutate({})}>+ Adicionar pessoa</Button>
    </div>
  );
}

export function AccessibilityTab({ project }: { project: Project }) {
  const upd = useUpdateProject(project.id);
  const a = (project.accessibility ?? {}) as Record<string, string>;
  return (
    <div className="space-y-8">
      {ACCESSIBILITY_GROUPS.map((g) => (
        <div key={g.key}>
          <h3 className="text-xl">{g.label}</h3>
          <p className="text-sm text-muted-foreground">{g.hint}</p>
          <Textarea className="mt-2 min-h-24 bg-paper" defaultValue={a[g.key] ?? ""}
            onBlur={(e) => e.target.value !== (a[g.key] ?? "") && upd.mutate({ accessibility: { ...a, [g.key]: e.target.value } })} />
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Lembre de prever no orçamento os custos de cada medida (categoria "Acessibilidade").</p>
    </div>
  );
}

export function DemocratizationTab({ project }: { project: Project }) {
  const upd = useUpdateProject(project.id);
  const d = (project.democratization ?? {}) as { measures?: string[]; details?: string };
  const measures = d.measures ?? [];
  const toggle = (m: string) =>
    upd.mutate({ democratization: { ...d, measures: measures.includes(m) ? measures.filter((x) => x !== m) : [...measures, m] } });
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Marque as medidas previstas. Confira no edital quantas são exigidas.</p>
      <div className="space-y-2">
        {DEMOCRATIZATION_MEASURES.map((m) => (
          <label key={m} className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={measures.includes(m)} onChange={() => toggle(m)} /> {m}
          </label>
        ))}
      </div>
      <h3 className="mt-6 text-xl">Como cada medida será feita</h3>
      <Textarea className="mt-2 min-h-32 bg-paper" defaultValue={d.details ?? ""}
        onBlur={(e) => e.target.value !== (d.details ?? "") && upd.mutate({ democratization: { ...d, details: e.target.value } })} />
    </div>
  );
}

export function DocumentsTab({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const q = useQuery({
    queryKey: ["docs", projectId],
    queryFn: async () => {
      const r = await supabase.from("project_documents").select("*").eq("project_id", projectId).order("created_at");
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
  });
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    for (const f of Array.from(files)) {
      const path = `${u.user!.id}/${projectId}/${crypto.randomUUID()}-${f.name}`;
      const up = await supabase.storage.from("project-files").upload(path, f);
      if (!up.error) await supabase.from("project_documents").insert({ project_id: projectId, name: f.name, path, mime: f.type, size: f.size });
    }
    setBusy(false);
    qc.invalidateQueries({ queryKey: ["docs", projectId] });
  }
  async function open(path: string) {
    const { data } = await supabase.storage.from("project-files").createSignedUrl(path, 120);
    if (data) window.open(data.signedUrl, "_blank");
  }
  async function del(id: string, path: string) {
    await supabase.storage.from("project-files").remove([path]);
    await supabase.from("project_documents").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["docs", projectId] });
  }
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Guarde aqui documentos pessoais, certidões, portfólio, cartas de anuência e orçamentos.</p>
      <Input type="file" multiple disabled={busy} onChange={(e) => upload(e.target.files)} className="bg-paper" />
      {busy && <p className="mt-2 text-xs">Enviando…</p>}
      <ul className="mt-6 divide-y divide-border">
        {(q.data ?? []).map((d) => (
          <li key={d.id} className="flex items-center justify-between py-2 text-sm">
            <button className="underline" onClick={() => open(d.path)}>{d.name}</button>
            <span className="flex gap-4 text-xs text-muted-foreground">
              {d.size ? `${Math.round(d.size / 1024)} KB` : ""}
              <button className="text-destructive underline" onClick={() => del(d.id, d.path)}>Excluir</button>
            </span>
          </li>
        ))}
        {q.data?.length === 0 && <li className="py-2 text-sm text-muted-foreground">Nenhum documento ainda.</li>}
      </ul>
    </div>
  );
}
