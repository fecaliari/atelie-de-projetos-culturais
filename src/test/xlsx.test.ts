import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import { buildExportModel } from "@/lib/exportDoc";
import { buildXlsxBytes } from "@/lib/exportXlsx";
import { builtinTemplate } from "@/lib/templates";
import type { Project } from "@/lib/data";

const tpl = builtinTemplate("builtin:generico")!;
const project = { id: "p1", name: "Teste", languages: [], accessibility: {}, democratization: {} } as unknown as Project;

describe("planilha .xlsx", () => {
  it("gera orçamento com fórmulas e total correto", async () => {
    const budget = [
      { id: "1", category: "Equipe & Produção", description: "Diretor <A>", unit: "mês", quantity: 2, occurrences: 3, unit_value: 1000, notes: "", position: 0 },
      { id: "2", category: "Divulgação", description: "Cartaz", unit: "un", quantity: 10, occurrences: 1, unit_value: 50.5, notes: "", position: 1 },
    ] as never[];
    const m = buildExportModel({ project, template: tpl, answers: [], budget, schedule: [], team: [], docs: [] });
    const zip = await JSZip.loadAsync(await buildXlsxBytes(m));
    const s1 = await zip.file("xl/worksheets/sheet1.xml")!.async("string");
    expect(s1).toContain("<f>D2*E2*F2</f>");
    expect(s1).toContain("<f>SUM(G2:G3)</f>");
    expect(s1).toContain("Equipe &amp; Produção");
    expect(s1).toContain("Diretor &lt;A&gt;");
    expect(s1).toContain("<v>6505</v>");
    expect(zip.file("xl/worksheets/sheet4.xml")).toBeTruthy();
  });

  it("não quebra com projeto vazio", async () => {
    const m = buildExportModel({ project, template: tpl, answers: [], budget: [], schedule: [], team: [], docs: [] });
    const bytes = await buildXlsxBytes(m);
    expect(bytes.length).toBeGreaterThan(500);
  });
});
