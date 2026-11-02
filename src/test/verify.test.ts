import { describe, expect, it } from "vitest";
import { runChecks } from "@/lib/verify";

const base = {
  fields: [{ key: "a", section: "S", label: "Resumo", kind: "long" as const, required: true, maxChars: 10 }],
  answers: { a: "ok" },
  budget: [{ description: "Cachê produtor", category: "Produção", quantity: 1, unit_value: 100, occurrences: 1 }],
  schedule: [{ activity: "x" }],
  team: [{ name: "Ana", role: "Produtor" }],
  docs: 1,
  accessibility: { libras: "sim" },
  democratization: ["Oficinas"],
};
const titles = (i: Partial<typeof base>) => runChecks({ ...base, ...i }).map((f) => f.title);

describe("verificação", () => {
  it("acusa campo obrigatório vazio", () => expect(titles({ answers: { a: "" } })).toContain("Campo obrigatório vazio: Resumo"));
  it("acusa limite de caracteres", () => expect(titles({ answers: { a: "12345678901" } })).toContain("Acima do limite: Resumo"));
  it("acusa função da equipe sem item no orçamento", () =>
    expect(titles({ team: [{ name: "Bia", role: "Iluminador" }] })).toContain("Função sem item no orçamento: Iluminador"));
  it("aceita função presente no orçamento", () =>
    expect(titles({}).some((t) => t.startsWith("Função sem item"))).toBe(false));
});
