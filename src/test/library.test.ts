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
