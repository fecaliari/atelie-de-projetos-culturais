// Gerador de .pdf com pdf-lib. Este módulo só é carregado por import dinâmico no clique,
// para não entrar no gráfico de renderização do servidor.
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "pdf-lib";
import type { ExportModel, ExportRow } from "./exportDoc";

const A4 = { w: 595.28, h: 841.89 };
const M = 56; // margem
const CW = A4.w - M * 2;

const INK = rgb(0.12, 0.12, 0.12);
const MUTED = rgb(0.42, 0.42, 0.42);
const LINE = rgb(0.78, 0.76, 0.72);
const ACCENT = rgb(0.45, 0.42, 0.25);

/** pdf-lib usa WinAnsi: tudo que estiver fora disso é trocado para não quebrar a geração. */
const WINANSI_EXTRA = new Set("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—™š›œžŸ".split(""));
function safe(s: string) {
  return s.replace(/[\u2192\u2190]/g, "->").replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, (c) => (WINANSI_EXTRA.has(c) ? c : ""));
}

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

class Sheet {
  doc: PDFDocument;
  page: PDFPage;
  y: number;
  r: PDFFont;
  b: PDFFont;
  i: PDFFont;

  constructor(doc: PDFDocument, fonts: [PDFFont, PDFFont, PDFFont]) {
    this.doc = doc;
    [this.r, this.b, this.i] = fonts;
    this.page = doc.addPage([A4.w, A4.h]);
    this.y = A4.h - M;
  }

  newPage() {
    this.page = this.doc.addPage([A4.w, A4.h]);
    this.y = A4.h - M;
  }

  need(h: number) {
    if (this.y - h < M + 24) this.newPage();
  }

  rule(gap = 8) {
    this.need(gap + 6);
    this.page.drawLine({ start: { x: M, y: this.y - gap }, end: { x: A4.w - M, y: this.y - gap }, thickness: 0.6, color: LINE });
    this.y -= gap + 8;
  }

  lines(text: string, size: number, font: PDFFont, width: number, indent = 0) {
    const out: string[] = [];
    for (const raw of safe(text).split("\n")) {
      if (!raw) {
        out.push("");
        continue;
      }
      let cur = "";
      for (const word of raw.split(/(\s+)/)) {
        const test = cur + word;
        if (font.widthOfTextAtSize(test, size) > width - indent && cur) {
          out.push(cur.trimEnd());
          cur = word.trimStart();
        } else cur = test;
      }
      out.push(cur.trimEnd());
    }
    return out;
  }

  text(text: string, opts: { size?: number; font?: PDFFont; color?: ReturnType<typeof rgb>; indent?: number; width?: number; leading?: number } = {}) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.r;
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    const width = opts.width ?? CW - indent;
    const leading = opts.leading ?? size * 1.42;
    for (const line of this.lines(text, size, font, width, indent)) {
      this.need(leading);
      this.page.drawText(line, { x: M + indent, y: this.y - size, size, font, color, lineHeight: leading });
      this.y -= leading;
    }
  }

  heading(text: string) {
    this.need(46);
    this.y -= 10;
    this.page.drawText(safe(text).toUpperCase(), { x: M, y: this.y - 12, size: 13, font: this.b, color: INK });
    this.y -= 20;
    this.page.drawLine({ start: { x: M, y: this.y }, end: { x: M + 34, y: this.y }, thickness: 2, color: ACCENT });
    this.y -= 10;
  }

  label(text: string) {
    this.need(24);
    this.y -= 2;
    this.page.drawText(safe(text), { x: M, y: this.y - 9, size: 9.5, font: this.b, color: MUTED });
    this.y -= 15;
  }

  table(headers: string[], widths: number[], rows: string[][]) {
    const draw = (cells: string[], bold: boolean) => {
      const wrapped = cells.map((c, i) => this.lines(c, 8.5, bold ? this.b : this.r, widths[i] - 8));
      const h = Math.max(...wrapped.map((w) => w.length)) * 11 + 8;
      this.need(h);
      const top = this.y;
      if (bold) this.page.drawRectangle({ x: M, y: top - h, width: CW, height: h, color: rgb(0.94, 0.93, 0.9) });
      let x = M;
      for (let i = 0; i < wrapped.length; i++) {
        wrapped[i].forEach((line, li) => {
          const w = widths[i] - 8;
          const tx = bold || i === widths.length - 1 ? x + 4 : x + 4;
          this.page.drawText(line, { x: tx, y: top - 12 - li * 11, size: 8.5, font: bold ? this.b : this.r, color: bold ? INK : INK });
        });
        x += widths[i];
      }
      this.page.drawLine({ start: { x: M, y: top - h }, end: { x: A4.w - M, y: top - h }, thickness: 0.5, color: LINE });
      this.y = top - h;
    };
    draw(headers, true);
    for (const r of rows) draw(r, false);
    this.y -= 6;
  }
}

export async function buildPdf(m: ExportModel): Promise<Blob> {
  const doc = await PDFDocument.create();
  doc.registerFontkit;
  const [r, b, i] = await Promise.all([doc.embedFont(StandardFonts.Helvetica), doc.embedFont(StandardFonts.HelveticaBold), doc.embedFont(StandardFonts.HelveticaOblique)]);
  const s = new Sheet(doc, [r, b, i]);

  // Abertura
  s.page.drawText(safe(m.templateName), { x: M, y: A4.h - M - 10, size: 10, font: i, color: MUTED });
  s.y = A4.h - M - 14;
  s.text(m.projectName, { size: 22, font: b, leading: 26 });
  s.text(`Situação: ${m.status}   ·   Gerado em ${m.generatedAt}`, { size: 9, font: r, color: MUTED });
  s.rule(10);

  s.heading("Informações gerais");
  for (const row of m.info) {
    s.label(row.label);
    s.text(row.text, { size: 10 });
    s.y -= 4;
  }

  for (const sec of m.sections) {
    s.heading(sec.title);
    for (const row of sec.rows) {
      s.label(row.label);
      s.text(row.text, { size: 10 });
      s.y -= 6;
    }
  }

  s.heading("Orçamento");
  if (!m.budget.lines.length) s.text("Nenhum item cadastrado.", { size: 10, font: i, color: MUTED });
  else {
    const w = [88, 190, 42, 34, 40, 60, 57];
    s.table(
      ["Categoria", "Descrição", "Unidade", "Qtd.", "Ocorr.", "Valor un.", "Total"],
      w,
      m.budget.lines.map((l) => [l.category, l.description, l.unit, String(l.quantity), String(l.occurrences), money(l.unit_value), money(l.total)]),
    );
    s.y -= 4;
    s.label("Totais por categoria");
    for (const c of m.budget.byCategory) s.text(`${c.label}: ${c.text}`, { size: 9.5, indent: 8 });
    s.y -= 2;
    s.text(`Total do projeto: ${money(m.budget.total)}`, { size: 11, font: b });
  }

  s.heading("Cronograma");
  if (!m.schedule.length) s.text("Nenhuma atividade cadastrada.", { size: 10, font: i, color: MUTED });
  else
    s.table(
      ["Etapa", "Atividade", "Início", "Fim", "Duração", "Local"],
      [80, 175, 60, 60, 55, 71],
      m.schedule.map((x) => [x.phase, x.activity, x.start_date ?? "—", x.end_date ?? "—", x.duration ?? "—", x.location ?? "—"]),
    );

  s.heading("Equipe");
  if (!m.team.length) s.text("Nenhuma pessoa cadastrada.", { size: 10, font: i, color: MUTED });
  for (const t of m.team) {
    s.label(`${t.name || "Sem nome"}${t.role ? ` — ${t.role}` : ""}`);
    s.text(t.bio || "— sem minicurrículo —", { size: 10 });
    s.y -= 6;
  }

  s.heading("Acessibilidade");
  const rows = (list: ExportRow[]) => {
    for (const row of list) {
      s.label(row.label);
      s.text(row.text, { size: 10 });
      s.y -= 6;
    }
  };
  rows(m.accessibility);

  s.heading("Democratização");
  rows(m.democratization);

  s.heading("Documentos anexados");
  if (!m.documents.length) s.text("Nenhum documento anexado.", { size: 10, font: i, color: MUTED });
  for (const d of m.documents) s.text(`•  ${d}`, { size: 10 });

  // Rodapé com paginação
  const pages = doc.getPages();
  pages.forEach((p, n) => {
    p.drawText(`Página ${n + 1} de ${pages.length}`, { x: A4.w - M - 70, y: M - 18, size: 8, font: r, color: MUTED });
    p.drawText(safe(m.projectName), { x: M, y: M - 18, size: 8, font: r, color: MUTED });
  });

  const bytes = await doc.save();
  return new Blob([bytes], { type: "application/pdf" });
}
