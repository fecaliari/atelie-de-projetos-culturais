// Modelo único do projeto para exportação. As respostas entram exatamente como foram escritas.
import type { Answer, Project } from "./data";
import type { Template } from "./templates";
import { ACCESSIBILITY_GROUPS, DEMOCRATIZATION_MEASURES, PHASES, brl, statusLabel } from "./constants";

export interface ExportRow {
  label: string;
  text: string;
}
export interface ExportSection {
  title: string;
  rows: ExportRow[];
}
export interface BudgetLine {
  category: string;
  description: string;
  unit: string;
  quantity: number;
  occurrences: number;
  unit_value: number;
  total: number;
}
export interface ScheduleLine {
  phase: string;
  activity: string;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  location: string | null;
}
export interface TeamLine {
  name: string;
  role: string;
  bio: string;
}

export interface ExportModel {
  projectName: string;
  templateName: string;
  mechanism: string;
  status: string;
  generatedAt: string;
  info: ExportRow[];
  sections: ExportSection[];
  budget: { lines: BudgetLine[]; byCategory: ExportRow[]; total: number };
  schedule: ScheduleLine[];
  team: TeamLine[];
  accessibility: ExportRow[];
  democratization: ExportRow[];
  documents: string[];
}

interface BudgetRow {
  category: string | null;
  description: string | null;
  unit: string | null;
  quantity: number | null;
  occurrences: number | null;
  unit_value: number | null;
}
interface ScheduleRow {
  phase: string | null;
  activity: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: string | null;
  location: string | null;
}
interface TeamRow {
  name: string | null;
  role: string | null;
  bio: string | null;
}

const EMPTY = "— sem resposta —";

export function buildExportModel(input: {
  project: Project;
  template: Template;
  answers: Answer[];
  budget: BudgetRow[];
  schedule: ScheduleRow[];
  team: TeamRow[];
  docs: { name: string | null }[];
}): ExportModel {
  const { project: p, template: t, answers, budget, schedule, team, docs } = input;
  const get = (k: string) => answers.find((a) => a.field_key === k)?.content?.trim() ?? "";

  const info: ExportRow[] = [
    { label: "Resumo", text: p.summary?.trim() || EMPTY },
    { label: "Linguagens", text: p.languages?.length ? p.languages.join(", ") : EMPTY },
    { label: "Categoria", text: p.category?.trim() || EMPTY },
    { label: "Formato", text: p.format?.trim() || EMPTY },
    { label: "Território", text: p.territory?.trim() || EMPTY },
    { label: "Proponente", text: [p.proponent_name?.trim(), p.proponent_type?.trim()].filter(Boolean).join(" — ") || EMPTY },
    { label: "Situação", text: statusLabel(p.status) },
  ];

  const sections: ExportSection[] = [];
  for (const f of t.fields) {
    let sec = sections.find((s) => s.title === f.section);
    if (!sec) sections.push((sec = { title: f.section, rows: [] }));
    sec.rows.push({ label: f.label, text: get(f.key) || EMPTY });
  }

  const lines: BudgetLine[] = budget.map((b) => {
    const quantity = Number(b.quantity ?? 0);
    const occurrences = Number(b.occurrences ?? 0);
    const unit_value = Number(b.unit_value ?? 0);
    return {
      category: b.category ?? "Outros",
      description: b.description ?? "",
      unit: b.unit ?? "",
      quantity,
      occurrences,
      unit_value,
      total: quantity * occurrences * unit_value,
    };
  });
  const total = lines.reduce((s, l) => s + l.total, 0);
  const byCategory = lines
    .reduce<ExportRow[]>((acc, l) => {
      const found = acc.find((x) => x.label === l.category);
      if (found) found.text = String(Number(found.text) + l.total);
      else acc.push({ label: l.category, text: String(l.total) });
      return acc;
    }, [])
    .filter((x) => Number(x.text) > 0)
    .map((x) => ({ label: x.label, text: brl(Number(x.text)) }));

  const acc = (p.accessibility ?? {}) as Record<string, string>;
  const accessibility: ExportRow[] = ACCESSIBILITY_GROUPS.map((g) => ({
    label: g.label,
    text: acc[g.key]?.trim() || EMPTY,
  }));

  const dem = (p.democratization ?? {}) as { measures?: string[]; details?: string };
  const democratization: ExportRow[] = [
    { label: "Medidas previstas", text: dem.measures?.length ? dem.measures.join("\n") : EMPTY },
    { label: "Como cada medida será feita", text: dem.details?.trim() || EMPTY },
  ];

  const scheduleLines: ScheduleLine[] = schedule.map((s) => ({
    phase: s.phase ?? "",
    activity: s.activity ?? "",
    start_date: s.start_date ?? null,
    end_date: s.end_date ?? null,
    duration: s.duration ?? null,
    location: s.location ?? null,
  }));
  const teamLines: TeamLine[] = team.map((m) => ({
    name: m.name ?? "",
    role: m.role ?? "",
    bio: m.bio ?? "",
  }));

  return {
    projectName: p.name,
    templateName: t.name,
    mechanism: t.mechanism,
    status: statusLabel(p.status),
    generatedAt: new Date().toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" }),
    info,
    sections,
    budget: { lines, byCategory, total },
    schedule: scheduleLines,
    team: teamLines,
    accessibility,
    democratization,
    documents: docs.map((d) => d.name ?? "").filter(Boolean),
  };
}

export const PHASE_ORDER = PHASES;
export const DEMOCRATIZATION_OPTIONS = DEMOCRATIZATION_MEASURES;

/** Nome de arquivo seguro, sem acentos nem espaços. */
export function fileName(base: string, ext: string) {
  const slug = base
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${slug || "projeto"}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type });
  const touch = window.matchMedia?.("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}
