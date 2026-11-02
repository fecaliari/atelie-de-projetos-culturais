import type { TemplateField } from "./templates";

export type Finding = { level: "erro" | "alerta" | "ok"; title: string; detail?: string };

type Budget = { description: string; category: string; quantity: number; unit_value: number; occurrences: number };
type Team = { name: string; role: string };

export function hasContent(v: unknown): boolean {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return true;
  if (Array.isArray(v)) return v.some(hasContent);
  if (typeof v === "object") return Object.values(v).some(hasContent);
  return false;
}

const norm = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

export function runChecks(input: {
  fields: TemplateField[];
  answers: Record<string, string>;
  budget: Budget[];
  schedule: { activity: string }[];
  team: Team[];
  docs: number;
  accessibility: unknown;
  democratization: unknown;
}): Finding[] {
  const out: Finding[] = [];
  for (const f of input.fields) {
    const v = (input.answers[f.key] ?? "").trim();
    if (f.required && !v) out.push({ level: "erro", title: `Campo obrigatório vazio: ${f.label}`, detail: f.section });
    if (f.maxChars && v.length > f.maxChars)
      out.push({ level: "erro", title: `Acima do limite: ${f.label}`, detail: `${v.length} de ${f.maxChars} caracteres` });
  }
  if (!input.budget.length) out.push({ level: "erro", title: "Orçamento vazio" });
  else if (input.budget.some((b) => b.quantity * b.unit_value * b.occurrences <= 0))
    out.push({ level: "alerta", title: "Há itens do orçamento com valor zero" });
  if (!input.schedule.length) out.push({ level: "erro", title: "Cronograma vazio" });
  if (!input.team.length) out.push({ level: "alerta", title: "Nenhuma pessoa na equipe" });

  const budgetText = norm(input.budget.map((b) => b.description).join(" | "));
  for (const t of input.team) {
    const role = norm(t.role).trim();
    if (role && !budgetText.includes(role))
      out.push({ level: "alerta", title: `Função sem item no orçamento: ${t.role}`, detail: t.name || undefined });
  }
  const accBudget = input.budget.some((b) => b.category === "Acessibilidade");
  if (!hasContent(input.accessibility)) out.push({ level: "erro", title: "Medidas de acessibilidade não preenchidas" });
  else if (!accBudget) out.push({ level: "alerta", title: "Acessibilidade descrita, mas sem custo na categoria Acessibilidade" });
  if (!hasContent(input.democratization)) out.push({ level: "erro", title: "Medidas de democratização de acesso não preenchidas" });
  if (input.docs === 0) out.push({ level: "alerta", title: "Nenhum documento anexado", detail: "Confira os documentos exigidos pelo edital." });
  if (!out.length) out.push({ level: "ok", title: "Nenhum problema encontrado nas conferências automáticas" });
  return out;
}
