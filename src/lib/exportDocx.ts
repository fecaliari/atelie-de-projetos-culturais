// Gerador de .docx. Este módulo só é carregado por import dinâmico no clique,
// para não entrar no gráfico de renderização do servidor.
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  LevelFormat,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ExportModel } from "./exportDoc";

const CONTENT = 9026; // A4 com margens de 1"
const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "BBBBBB" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const margins = { top: 80, bottom: 80, left: 120, right: 120 };

function cell(text: string, w: number, opts: { bold?: boolean; right?: boolean; fill?: string | undefined } = {}) {
  return new TableCell({
    borders: cellBorders,
    width: { size: w, type: WidthType.DXA },
    margins,
    ...(opts.fill ? { shading: { fill: opts.fill, type: ShadingType.CLEAR } } : {}),
    children: [
      new Paragraph({
        alignment: opts.right ? AlignmentType.RIGHT : AlignmentType.LEFT,
        children: [new TextRun({ text: text || "—", bold: !!opts.bold, size: 18 })],
      }),
    ],
  });
}

function tableOf(widths: number[], rows: (string | boolean | undefined)[][]) {
  return new Table({
    width: { size: CONTENT, type: WidthType.DXA },
    columnWidths: widths,
    rows: rows.map(
      (r, i) =>
        new TableRow({
          tableHeader: i === 0,
          children: r.map((v, c) =>
            cell(String(v ?? ""), widths[c] ?? 0, { bold: i === 0, right: c === widths.length - 1 && i > 0, fill: i === 0 ? "EFEDE6" : undefined }),
          ),
        }),
    ),
  });
}

const heading = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(text)] });
const sub = (text: string) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(text)] });
const para = (text: string, opts: { bold?: boolean; italics?: boolean; size?: number } = {}) =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, bold: !!opts.bold, italics: !!opts.italics, size: opts.size ?? 22 })] });
const bullet = (text: string) => new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text, size: 22 })] });

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export async function buildDocx(m: ExportModel): Promise<Blob> {
  const children: (Paragraph | Table)[] = [];

  children.push(
    new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: m.templateName, size: 20, color: "6B6B6B" })] }),
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(m.projectName)] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: `Situação: ${m.status}  ·  Gerado em ${m.generatedAt}`, size: 20, color: "6B6B6B" })] }),
  );

  children.push(heading("Informações gerais"));
  for (const r of m.info) {
    children.push(sub(r.label));
    children.push(para(r.text));
  }

  for (const s of m.sections) {
    children.push(heading(s.title));
    for (const r of s.rows) {
      children.push(sub(r.label));
      for (const line of r.text.split("\n")) children.push(para(line));
    }
  }

  children.push(heading("Orçamento"));
  if (m.budget.lines.length === 0) children.push(para("Nenhum item cadastrado."));
  else {
    const w = [1500, 3026, 800, 600, 700, 1200, 1200];
    children.push(
      tableOf(
        w,
        [
          ["Categoria", "Descrição", "Unidade", "Qtd.", "Ocorr.", "Valor un.", "Total"],
          ...m.budget.lines.map((l) => [l.category, l.description, l.unit, String(l.quantity), String(l.occurrences), money(l.unit_value), money(l.total)]),
        ],
      ),
    );
    children.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: "Totais por categoria", bold: true })] }));
    for (const c of m.budget.byCategory) children.push(bullet(`${c.label}: ${c.text}`));
    children.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: `Total do projeto: ${money(m.budget.total)}`, bold: true, size: 24 })] }));
  }

  children.push(heading("Cronograma"));
  if (m.schedule.length === 0) children.push(para("Nenhuma atividade cadastrada."));
  else {
    const w = [1200, 2800, 1200, 1200, 1200, 1426];
    children.push(
      tableOf(
        w,
        [
          ["Etapa", "Atividade", "Início", "Fim", "Duração", "Local"],
          ...m.schedule.map((s) => [s.phase, s.activity, s.start_date ?? "—", s.end_date ?? "—", s.duration ?? "—", s.location ?? "—"]),
        ],
      ),
    );
  }

  children.push(heading("Equipe"));
  if (m.team.length === 0) children.push(para("Nenhuma pessoa cadastrada."));
  for (const t of m.team) {
    children.push(sub(`${t.name || "Sem nome"}${t.role ? ` — ${t.role}` : ""}`));
    children.push(para(t.bio || "— sem minicurrículo —"));
  }

  children.push(heading("Acessibilidade"));
  for (const r of m.accessibility) {
    children.push(sub(r.label));
    children.push(para(r.text));
  }

  children.push(heading("Democratização"));
  for (const r of m.democratization) {
    children.push(sub(r.label));
    for (const line of r.text.split("\n")) children.push(para(line));
  }

  children.push(heading("Documentos anexados"));
  if (m.documents.length === 0) children.push(para("Nenhum documento anexado."));
  for (const d of m.documents) children.push(bullet(d));

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 360, hanging: 180 } } },
            },
          ],
        },
      ],
    },
    styles: {
      default: { document: { run: { font: "Calibri", size: 22 } } },
      paragraphStyles: [
        { id: "Title", name: "Title", basedOn: "Normal", run: { size: 44, bold: true, font: "Calibri" }, paragraph: { spacing: { after: 120 } } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 28, bold: true, font: "Calibri" }, paragraph: { spacing: { before: 320, after: 160 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 22, bold: true, font: "Calibri", color: "444444" }, paragraph: { spacing: { before: 200, after: 60 }, outlineLevel: 1 } },
      ],
    },
    sections: [
      {
        properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
