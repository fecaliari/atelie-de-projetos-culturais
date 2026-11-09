import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/LibraryPage";
import { libraryQuery } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/editais")({
  head: () => ({ meta: [{ title: "Biblioteca de editais — Ateliê Cultural" }, { name: "description", content: "Seu acervo privado de editais culturais com leitura por IA e revisão manual." }, { property: "og:title", content: "Biblioteca de editais — Ateliê Cultural" }, { property: "og:description", content: "Fontes, exigências e anotações dos seus editais culturais." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(libraryQuery("editais")),
  component: () => <LibraryPage library="editais" />,
});
