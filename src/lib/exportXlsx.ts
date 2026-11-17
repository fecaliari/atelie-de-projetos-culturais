// Gerador de planilha .xlsx (orçamento, resumo por categoria, cronograma e equipe).
// Só é carregado por import dinâmico no clique. Usa o JSZip, que já vem junto com o gerador de .docx.
import JSZip from "jszip";
import type { ExportModel } from "./exportDoc";

interface Cell {
  v?: string | number | null;
  f?: string; // fórmula, sem o "="
  s?: number; // estilo (ver STYLES)
}

// Estilos: 0 normal | 1 cabeçalho | 2 dinheiro | 3 dinheiro em negrito | 4 porcentagem | 5 negrito | 6 texto com quebra
const STYLES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="1"><numFmt numFmtId="164" formatCode="&quot;R$&quot;\\ #,##0.00"/></numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8E8E8"/><bgColor indexed="64"/></patternFill></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="7">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/>
<xf numFmtId="10" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
</cellXfs>
</styleSheet>`;

const esc = (s: string) =>
  s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function col(i: number) {
  let n = i + 1;
  let out = "";
  while (n > 0) {
    out = String.fromCharCode(65 + ((n - 1) % 26)) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function sheetXml(rows: Cell[][], widths: number[]) {
  const cols = widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join("");
  const body = rows
    .map((row, r) => {
      const cells = row
        .map((c, i) => {
          const ref = `${col(i)}${r + 1}`;
          const s = c.s ? ` s="${c.s}"` : "";
          if (c.f !== undefined) return `<c r="${ref}"${s}><f>${esc(c.f)}</f><v>${Number(c.v ?? 0)}</v></c>`;
          if (c.v === null || c.v === undefined || c.v === "") return s ? `<c r="${ref}"${s}/>` : "";
          if (typeof c.v === "number") return `<c r="${ref}"${s}><v>${c.v}</v></c>`;
          return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(c.v)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData></worksheet>`;
}

const head = (labels: string[]): Cell[] => labels.map((v) => ({ v, s: 1 }));

export async function buildXlsxBytes(model: ExportModel): Promise<Uint8Array> {
  // 1) Orçamento
  const lines = model.budget.lines;
  const last = lines.length + 1;
  const orc: Cell[][] = [head(["Categoria", "Descrição", "Unidade", "Quantidade", "Ocorrências", "Valor unitário", "Total"])];
  lines.forEach((l, i) => {
    const r = i + 2;
    orc.push([
      { v: l.category, s: 6 },
      { v: l.description, s: 6 },
      { v: l.unit },
      { v: l.quantity },
      { v: l.occurrences },
      { v: l.unit_value, s: 2 },
      { v: l.quantity * l.occurrences * l.unit_value, f: `D${r}*E${r}*F${r}`, s: 2 },
    ]);
  });
  const total = lines.reduce((a, l) => a + l.quantity * l.occurrences * l.unit_value, 0);
  orc.push([
    { v: "TOTAL", s: 5 }, {}, {}, {}, {}, {},
    lines.length ? { v: total, f: `SUM(G2:G${last})`, s: 3 } : { v: 0, s: 3 },
  ]);

  // 2) Resumo por categoria (SUMIF liga ao orçamento: se algo mudar lá, aqui atualiza)
  const cats = [...new Set(lines.map((l) => l.category || "Sem categoria"))];
  const totalRow = cats.length + 2;
  const res: Cell[][] = [head(["Categoria", "Total", "% do orçamento"])];
  cats.forEach((c, i) => {
    const r = i + 2;
    const sum = lines.filter((l) => (l.category || "Sem categoria") === c).reduce((a, l) => a + l.quantity * l.occurrences * l.unit_value, 0);
    res.push([
      { v: c },
      { v: sum, f: `SUMIF('Orçamento'!$A$2:$A$${last},A${r},'Orçamento'!$G$2:$G$${last})`, s: 2 },
      { v: total ? sum / total : 0, f: `IF(B$${totalRow}=0,0,B${r}/B$${totalRow})`, s: 4 },
    ]);
  });
  res.push([{ v: "TOTAL", s: 5 }, cats.length ? { v: total, f: `SUM(B2:B${totalRow - 1})`, s: 3 } : { v: 0, s: 3 }, {}]);

  // 3) Cronograma e 4) Equipe
  const cro: Cell[][] = [head(["Etapa", "Atividade", "Início", "Fim", "Duração", "Local"])];
  model.schedule.forEach((s) =>
    cro.push([{ v: s.phase }, { v: s.activity, s: 6 }, { v: s.start_date }, { v: s.end_date }, { v: s.duration }, { v: s.location }]),
  );
  const eq: Cell[][] = [head(["Nome", "Função", "Minicurrículo"])];
  model.team.forEach((t) => eq.push([{ v: t.name }, { v: t.role }, { v: t.bio, s: 6 }]));

  const sheets = [
    { name: "Orçamento", rows: orc, widths: [22, 48, 12, 12, 12, 16, 16] },
    { name: "Resumo", rows: res, widths: [28, 18, 16] },
    { name: "Cronograma", rows: cro, widths: [20, 48, 14, 14, 14, 24] },
    { name: "Equipe", rows: eq, widths: [28, 28, 70] },
  ];

  const zip = new JSZip();
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets
      .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join("")}</Types>`,
  );
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  );
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
      .map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets></workbook>`,
  );
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
  );
  zip.file("xl/styles.xml", STYLES);
  sheets.forEach((s, i) => zip.file(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s.rows, s.widths)));
  return zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function buildXlsx(model: ExportModel): Promise<Blob> {
  const bytes = await buildXlsxBytes(model);
  return new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
