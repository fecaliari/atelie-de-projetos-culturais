import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";

const INSTRUCTIONS = `Você é uma avaliadora experiente de projetos culturais (Funcultura-ES, Lei Rouanet e editais).
Receberá o texto completo de um projeto, o orçamento, cronograma, equipe, acessibilidade e democratização.
Responda em português do Brasil, em Markdown, com estas seções:
## Erros de texto — ortografia, gramática, frases confusas (cite o trecho e a correção).
## Produtos e ações sem custo — ações/produtos citados no texto que não aparecem no orçamento.
## Coerência — se cronograma, equipe e orçamento batem entre si.
## Metas — se as metas são mensuráveis; sugira indicadores.
## Acessibilidade e democratização — se atendem ao que o edital costuma exigir.
## Documentos — documentos que provavelmente faltam.
## Estimativa — relevância (0–10) e chance de aprovação (baixa/média/alta), com justificativa e 3 melhorias prioritárias.
Deixe claro que a estimativa é orientativa. Não reescreva o projeto inteiro.`;

export const Route = createFileRoute("/api/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
        if (!token) return new Response("Não autorizado", { status: 401 });
        const sb = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_PUBLISHABLE_KEY"]!, {
          auth: { persistSession: false },
        });
        const { data, error } = await sb.auth.getUser(token);
        if (error || !data.user) return new Response("Não autorizado", { status: 401 });
        const body = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(body.messages)) return new Response("Pedido inválido", { status: 400 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("IA não configurada", { status: 500 });
        const messages = await convertToModelMessages(body.messages.slice(-1));
        const { createResponsesCall } = await import("@/lib/ai-gateway.server");
        return createResponsesCall(
          request,
          { baseURL: "https://ai.gateway.lovable.dev/v1", apiKey, model: "openai/gpt-6-astra" },
          messages,
          INSTRUCTIONS,
        ).response();
      },
    },
  },
});
