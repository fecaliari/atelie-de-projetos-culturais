import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/radar")({
  head: () => ({ meta: [{ title: "Radar de oportunidades — Ateliê Cultural" }, { name: "description", content: "Editais do ES e nacionais, sempre com verificação de fonte." }] }),
  component: () => <ComingSoon eyebrow="Fase 3" title="Radar de oportunidades" text="Editais do ES e nacionais, sempre com verificação de fonte." />,
});
