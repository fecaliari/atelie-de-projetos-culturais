import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/editais")({
  head: () => ({ meta: [{ title: "Biblioteca de editais — Ateliê Cultural" }, { name: "description", content: "Seus editais com leitura inteligente e revisão manual." }] }),
  component: () => <ComingSoon eyebrow="Fase 2" title="Biblioteca de editais" text="Seus editais com leitura inteligente e revisão manual." />,
});
