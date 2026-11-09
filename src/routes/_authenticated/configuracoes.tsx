import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/components/ComingSoon";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Ateliê Cultural" }, { name: "description", content: "Preferências da conta e integrações." }, { property: "og:title", content: "Configurações — Ateliê Cultural" }, { property: "og:description", content: "Preferências da conta e integrações." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: () => <ComingSoon eyebrow="Conta" title="Configurações" text="Preferências da conta e integrações." />,
});
