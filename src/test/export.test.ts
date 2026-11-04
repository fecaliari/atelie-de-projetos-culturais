import { describe, expect, it } from "vitest";
import { buildExportModel, fileName } from "@/lib/exportDoc";
import { brl } from "@/lib/constants";
import { builtinTemplate } from "@/lib/templates";
import type { Answer, Project } from "@/lib/data";

const tpl = builtinTemplate("builtin:generico")!;
const project = {
  id: "p1",
  name: "Vozes do Manguezal",
  summary: "Mostra itinerante de documentários.",
  languages: ["Audiovisual"],
  category: "Mostra",
  format: "Presencial",
  territory: "Vitória/ES",
  proponent_type: "Coletivo",
  proponent_name: "Coletivo Mangue",
  mechanism: "",
  template_ref: "builtin:generico",
  status: "estruturacao",
  accessibility: { arquitetonica: "Rampa de acesso na entrada principal." },
  democratization: { measures: ["Atividades gratuitas"], details: "Sessões abertas em praças." },
} as unknown as Project;

const answers = [
  { field_key: "nome", content: "Vozes do Manguezal – mostra de documentários de Vitória" },
  { field_key: "ao_final", content: "6 filmes finalizados com legendas." },
] as unknown as Answer[];

describe("exportação do projeto", () => {
  it("mantém as respostas exatamente como foram escritas", () => {
    const m = buildExportModel({ project, template: tpl, answers, budget: [], schedule: [], team: [], docs: [] });
    const all = m.sections.flatMap((s) => s.rows);
    expect(all.find((r) => r.label === "Qual é o nome do projeto?")?.text).toBe("Vozes do Manguezal – mostra de documentários de Vitória");
    expect(all.find((r) => r.label === "O que deverá estar realizado ao final do projeto?")?.text).toBe("6 filmes finalizados com legendas.");
  });

  it("marca como sem resposta o campo obrigatório vazio, sem inventar texto", () => {
    const m = buildExportModel({ project, template: tpl, answers, budget: [], schedule: [], team: [], docs: [] });
    const all = m.sections.flatMap((s) => s.rows);
    expect(all.find((r) => r.label === "Por que esse projeto precisa ser realizado?")?.text).toBe("— sem resposta —");
  });

  it("soma o orçamento por quantidade × ocorrências × valor unitário", () => {
    const m = buildExportModel({
      project,
      template: tpl,
      answers,
      budget: [
        { category: "Produção", description: "Câmera", unit: "diária", quantity: 5, occurrences: 2, unit_value: 400 },
        { category: "Acessibilidade", description: "Intérprete de Libras", unit: "h", quantity: 10, occurrences: 1, unit_value: 90 },
      ],
      schedule: [],
      team: [],
      docs: [],
    });
    expect(m.budget.total).toBe(4000 + 900);
    expect(m.budget.byCategory.find((c) => c.label === "Acessibilidade")?.text).toBe(brl(900));
  });

  it("gera nome de arquivo sem acentos nem espaços", () => {
    expect(fileName("Vozes do Manguezal – Mostra 2026!", "docx")).toBe("vozes-do-manguezal-mostra-2026.docx");
  });
});
