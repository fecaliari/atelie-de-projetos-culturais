import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/referencias")({
  head: () => ({ meta: [{ title: "Biblioteca de referências — Ateliê Cultural" }, { name: "description", content: "Arquivos, links, vídeos e textos de pesquisa." }] }),
  component: () => <ComingSoon eyebrow="Fase 2" title="Biblioteca de referências" text="Arquivos, links, vídeos e textos de pesquisa." />,
});
