import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ateliê Cultural — projetos culturais com autoria" },
      { name: "description", content: "Estruture projetos culturais para editais do Espírito Santo e do Brasil respondendo a perguntas guiadas." },
      { property: "og:title", content: "Ateliê Cultural — projetos culturais com autoria" },
      { property: "og:description", content: "Perguntas guiadas, orçamento, cronograma e exportação para Funcultura, Lei Rouanet e outros editais." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-foreground/80 px-6 py-5">
        <span className="font-serif text-xl">Ateliê Cultural</span>
        <Link to="/auth" className="text-sm underline-offset-4 hover:underline">Entrar</Link>
      </header>
      <main className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-12">
        <div className="md:col-span-8">
          <p className="eyebrow">Caderno de trabalho · Espírito Santo</p>
          <h1 className="mt-6 text-5xl leading-[1.05] font-light md:text-7xl">
            Da ideia ao projeto,<br /><em className="text-primary">com a sua voz.</em>
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted-foreground">
            Um ateliê para estruturar projetos culturais por meio de perguntas. Você escreve; o sistema organiza,
            aponta lacunas e monta o formulário do edital.
          </p>
          <Link to="/auth" className="mt-10 inline-flex items-center rounded-sm bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Abrir o ateliê
          </Link>
        </div>
        <aside className="space-y-6 border-l border-border pl-6 md:col-span-4">
          {[
            ["01", "Construção guiada", "Perguntas por etapa, com exemplos que nunca são copiados para a sua resposta."],
            ["02", "Editais reais", "Roteiros fiéis à ficha do Funcultura e ao Manual da Lei Rouanet — e campos próprios para cada edital."],
            ["03", "Planejamento", "Orçamento com cálculo automático, cronograma, equipe, acessibilidade e democratização."],
          ].map(([n, t, d]) => (
            <div key={n} className="border-b border-border pb-6">
              <span className="font-serif text-terra">{n}</span>
              <h3 className="mt-1 text-xl">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}
