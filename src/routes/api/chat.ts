import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, type UIMessage } from "ai";
import { createClient } from "@supabase/supabase-js";
import { createResponsesCall } from "@/server/ai/responses";

const INSTRUCTIONS = `Você é a assistente de ajuda do Ateliê Cultural, um app para escrever projetos culturais (Funcultura-ES, Lei Rouanet, editais).
Responda em português do Brasil, de forma clara e breve.
Ajude a entender editais, conceitos (contrapartida, democratização, acessibilidade, orçamento), e como usar o app.
Nunca escreva o texto do projeto pela pessoa: oriente com perguntas, explicações e exemplos genéricos.`;

export const Route = createFileRoute("/api/chat")({
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

        const messages = await convertToModelMessages(body.messages);
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
