import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Library = "editais" | "referencias";
export type Source = Database["public"]["Tables"]["library_sources"]["Row"];
export const SOURCE_KINDS = { arquivo: "Arquivo", link: "Link", video: "Vídeo", texto: "Texto" };
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