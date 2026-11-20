import { describe, expect, it } from "vitest";
import { publicLink, readingContent } from "@/lib/library";

describe("Fontes de pesquisa", () => {
  it("preserves source text exactly", () => {
    const text = "  Artigo 1º\nValor: R$ 20.000\n";
    expect(readingContent(text)).toBe(text);
  });
  it("rejects executable links", () => {
    expect(() => publicLink("javascript:alert(1)")).toThrow();
    expect(publicLink("https://www.gov.br/cultura")).toBe("https://www.gov.br/cultura");
  });
  it("does not pretend to read a link without content", () => {
    expect(() => readingContent("  \n")).toThrow();
  });
});
import { parseTags, allTags, parseYear, deadlineLabel } from "@/lib/library";
describe("Etiquetas e metadados", () => {
  it("limpa etiquetas repetidas e vazias", () => {
    expect(parseTags("Rouanet, audiovisual,  rouanet ;; Música\nmúsica")).toEqual(["Rouanet", "audiovisual", "Música"]);
  });
  it("junta as etiquetas do acervo sem repetir", () => {
    expect(allTags([{ tags: ["b", "A"] }, { tags: ["a", "C"] }, { tags: null }])).toEqual(["A", "b", "C"]);
  });
  it("valida o ano", () => {
    expect(parseYear("")).toBeNull();
    expect(parseYear("2026")).toBe(2026);
    expect(() => parseYear("26")).toThrow();
  });
  it("descreve o prazo", () => {
    const hoje = new Date(2026, 10, 17);
    expect(deadlineLabel("2026-11-16", hoje)).toBe("prazo encerrado");
    expect(deadlineLabel("2026-11-17", hoje)).toBe("prazo é hoje");
    expect(deadlineLabel("2026-11-18", hoje)).toBe("prazo amanhã");
    expect(deadlineLabel("2026-11-27", hoje)).toBe("prazo em 10 dias");
    expect(deadlineLabel(null, hoje)).toBe("");
  });
});

import { sourceForPrompt } from "@/lib/library";
describe("Fonte levada para a verificação", () => {
  const base = { title: "Edital X", organ: "Secult-ES", year: 2026, sphere: "estadual", deadline: "2026-12-01", analysis: "", reviewed: false, content: "Art. 1º", notes: "" };
  it("inclui dados, texto e marca leitura não conferida", () => {
    const t = sourceForPrompt({ ...base, analysis: "Valor máx. R$ 50 mil" });
    expect(t).toContain("Edital X · Secult-ES · 2026 · estadual · prazo 2026-12-01");
    expect(t).toContain("preliminar, ainda não conferida");
    expect(t).toContain("Art. 1º");
  });
  it("corta texto muito grande avisando", () => {
    expect(sourceForPrompt({ ...base, content: "a".repeat(100) }, 10)).toContain("texto cortado por tamanho");
  });
});

import { previousCandidates, compareMaterial } from "@/lib/library";
describe("Edições do mesmo edital", () => {
  const a = { id: "a", previous_id: null }, b = { id: "b", previous_id: "a" }, c = { id: "c", previous_id: "b" }, d = { id: "d", previous_id: null };
  it("não deixa escolher a si mesmo nem uma edição posterior", () => {
    expect(previousCandidates([a, b, c, d], "a").map(s => s.id)).toEqual(["d"]);
    expect(previousCandidates([a, b, c, d], "b").map(s => s.id)).toEqual(["a", "d"]);
    expect(previousCandidates([a, b], null).length).toBe(2);
  });
  it("monta o material de comparação com as duas edições", () => {
    const t = compareMaterial({ title: "Edital", year: 2026, content: "velho" }, { title: "Edital", year: 2027, content: "novo" });
    expect(t).toContain("EDIÇÃO ANTERIOR — Edital (2026)\nvelho");
    expect(t).toContain("EDIÇÃO NOVA — Edital (2027)\nnovo");
  });
});
