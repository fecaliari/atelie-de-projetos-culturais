import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/modelos")({
  head: () => ({ meta: [{ title: "Modelos de edital — Ateliê Cultural" }, { name: "description", content: "Crie modelos a partir do Funcultura ou da Rouanet e adicione campos próprios de cada edital." }] }),
  component: () => <ComingSoon eyebrow="Modelos" title="Modelos de edital" text="Crie modelos a partir do Funcultura ou da Rouanet e adicione campos próprios de cada edital." />,
});
