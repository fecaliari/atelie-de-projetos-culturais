import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Library = "editais" | "referencias";
export type Source = Database["public"]["Tables"]["library_sources"]["Row"];
export const SOURCE_KINDS = { arquivo: "Arquivo", link: "Link", video: "Vídeo", texto: "Texto" };
export const SPHERES = { federal: "Federal", estadual: "Estadual", municipal: "Municipal", privado: "Privado", outro: "Outro" };
/** Transforma "Rouanet, audiovisual,  rouanet" em ["Rouanet", "audiovisual"] (sem repetir, sem vazios). */
export function parseTags(text: string) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[,;\n]/)) {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    const key = tag.toLocaleLowerCase("pt-BR");
    if (tag && !seen.has(key)) { seen.add(key); out.push(tag); }
  }
  return out.slice(0, 20);
}
export function allTags(sources: { tags?: string[] | null }[]) {
  const map = new Map<string, string>();
  for (const s of sources) for (const t of s.tags ?? []) if (!map.has(t.toLocaleLowerCase("pt-BR"))) map.set(t.toLocaleLowerCase("pt-BR"), t);
  return [...map.values()].sort((a, b) => a.localeCompare(b, "pt-BR"));
}
export function parseYear(text: string) {
  if (!text.trim()) return null;
  const n = Number(text);
  if (!Number.isInteger(n) || n < 1990 || n > 2100) throw new Error("Informe o ano com 4 números (por exemplo, 2026).");
  return n;
}
/** Prazo: "vencido", "hoje", "em N dias" ou "" quando não há prazo. */
export function deadlineLabel(deadline: string | null | undefined, today = new Date()) {
  if (!deadline) return "";
  const [y = 0, m = 1, d = 1] = deadline.split("-").map(Number);
  const days = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
  if (days < 0) return "prazo encerrado";
  if (days === 0) return "prazo é hoje";
  return days === 1 ? "prazo amanhã" : `prazo em ${days} dias`;
}
export function publicLink(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("Use um link http ou https.");
  return url.href;
}
export function readingContent(content: string) {
  if (!content.trim()) throw new Error("Adicione o texto da fonte ou a transcrição do vídeo para realizar a leitura.");
  if (content.length > 180000) throw new Error("O texto excede 180 mil caracteres. Divida a fonte em partes.");
  return content;
}
export const libraryQuery = (library: Library) => queryOptions({
  queryKey: ["library", library],
  queryFn: async () => {
    const r = await supabase.from("library_sources").select("*").eq("library", library).order("updated_at", { ascending: false });
    if (r.error) throw new Error(r.error.message);
    return r.data;
  },
});

export async function extractSourceFile(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error("O arquivo deve ter até 10 MB.");
  if (!file.size) throw new Error("O arquivo está vazio.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "txt" || extension === "md") return readingContent(await file.text());
  if (extension === "docx") {
    const mammoth = await import("mammoth/mammoth.browser");
    return readingContent((await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value);
  }
  if (extension === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const loading = pdfjs.getDocument({ data: await file.arrayBuffer() });
    const pdf = await loading.promise;
    try {
      const pages: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        pages.push(text.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join(""));
      }
      const value = pages.join("\n\n");
      if (!value.trim()) throw new Error("Este PDF não contém texto selecionável. Cole o texto da fonte para realizar a leitura.");
      return readingContent(value);
    } finally { await loading.destroy(); }
  }
  throw new Error("Escolha um arquivo PDF, DOCX, TXT ou MD.");
}
// ---- Ligações entre projetos e fontes ----
export type ProjectSourceLink = Database["public"]["Tables"]["project_sources"]["Row"];
export const linksOfProject = (projectId: string) => queryOptions({
  queryKey: ["project-sources", projectId],
  queryFn: async () => {
    const r = await supabase.from("project_sources").select("*").eq("project_id", projectId);
    if (r.error) throw new Error(r.error.message);
    return r.data;
  },
});
export const linksOfSource = (sourceId: string) => queryOptions({
  queryKey: ["source-projects", sourceId],
  queryFn: async () => {
    const r = await supabase.from("project_sources").select("project_id, projects(id, name, status)").eq("source_id", sourceId);
    if (r.error) throw new Error(r.error.message);
    return r.data as unknown as { project_id: string; projects: { id: string; name: string; status: string } | null }[];
  },
});
/** Texto do edital escolhido para a verificação: dados, leitura revisada e o texto (cortado se for enorme). */
export type Excerpt = Database["public"]["Tables"]["source_excerpts"]["Row"];
export const excerptsOfSource = (sourceId: string) => queryOptions({
  queryKey: ["excerpts", sourceId],
  queryFn: async () => {
    const r = await supabase.from("source_excerpts").select("*").eq("source_id", sourceId).order("created_at");
    if (r.error) throw new Error(r.error.message);
    return r.data;
  },
});
export function excerptLine(e: Pick<Excerpt, "label" | "location" | "excerpt">) {
  const where = [e.label.trim(), e.location.trim() ? `(${e.location.trim()})` : ""].filter(Boolean).join(" ");
  return `- ${where ? where + ": " : ""}“${e.excerpt.trim()}”`;
}
export function sourceForPrompt(s: Pick<Source, "title" | "organ" | "year" | "sphere" | "deadline" | "analysis" | "reviewed" | "content" | "notes">, maxChars = 60000, excerpts: Pick<Excerpt, "label" | "location" | "excerpt">[] = []) {
  const head = [s.title, s.organ, s.year ? String(s.year) : "", s.sphere ?? "", s.deadline ? `prazo ${s.deadline}` : ""].filter(Boolean).join(" · ");
  const parts = [`### ${head}`];
  if (s.analysis.trim()) parts.push(`Leitura ${s.reviewed ? "(conferida pelo usuário com o original)" : "(preliminar, ainda não conferida)"}:\n${s.analysis.trim()}`);
  if (excerpts.length) parts.push(`Trechos marcados pelo usuário, com a origem:\n${excerpts.map(excerptLine).join("\n")}`);
  if (s.notes.trim()) parts.push(`Anotações do usuário:\n${s.notes.trim()}`);
  if (s.content.trim()) parts.push(`Texto da fonte:\n${s.content.length > maxChars ? s.content.slice(0, maxChars) + "\n[…texto cortado por tamanho]" : s.content}`);
  return parts.join("\n\n");
}

// ---- Edições do mesmo edital ----
/** Quem pode ser "edição anterior" de um edital: qualquer outro, menos ele mesmo e as edições que vieram depois dele (evita ciclo). */
export function previousCandidates<T extends { id: string; previous_id: string | null }>(sources: T[], id: string | null) {
  if (!id) return sources;
  const banned = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const s of sources) if (s.previous_id && banned.has(s.previous_id) && !banned.has(s.id)) { banned.add(s.id); grew = true; }
  }
  return sources.filter(s => !banned.has(s.id));
}
/** Texto para o chat da pessoa comparar duas edições (cada texto é cortado se for enorme). */
export function compareMaterial(prev: Pick<Source, "title" | "year" | "content">, next: Pick<Source, "title" | "year" | "content">, maxChars = 60000) {
  const cut = (t: string) => t.length > maxChars ? t.slice(0, maxChars) + "\n[…texto cortado por tamanho]" : t;
  return `# EDIÇÃO ANTERIOR — ${prev.title}${prev.year ? ` (${prev.year})` : ""}\n${cut(prev.content)}\n\n# EDIÇÃO NOVA — ${next.title}${next.year ? ` (${next.year})` : ""}\n${cut(next.content)}`;
}
