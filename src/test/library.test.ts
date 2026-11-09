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