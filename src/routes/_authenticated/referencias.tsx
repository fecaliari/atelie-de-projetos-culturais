import { createFileRoute } from "@tanstack/react-router";
import { LibraryPage } from "@/components/LibraryPage";
import { libraryQuery } from "@/lib/library";

export const Route = createFileRoute("/_authenticated/referencias")({
  head: () => ({ meta: [{ title: "Biblioteca de referências — Ateliê Cultural" }, { name: "description", content: "Arquivos, links, vídeos e textos no seu acervo privado de pesquisa cultural." }, { property: "og:title", content: "Biblioteca de referências — Ateliê Cultural" }, { property: "og:description", content: "Organize e revise suas fontes de pesquisa cultural." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(libraryQuery("referencias")),
  component: () => <LibraryPage library="referencias" />,
});
