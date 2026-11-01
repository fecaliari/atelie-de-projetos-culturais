import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { HelpCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const transport = new DefaultChatTransport({
  api: "/api/chat",
  headers: async (): Promise<Record<string, string>> => {
    const { data } = await supabase.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  },
});

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const { messages, sendMessage, status, stop } = useChat({
    transport,
    onError: (e) => {
      const m = e.message || "";
      toast.error(m.includes("429") ? "Muitas mensagens seguidas. Aguarde um pouco." : m.includes("402") ? "Créditos de IA esgotados." : "Não foi possível falar com a ajuda agora.");
    },
  });
  const busy = status === "submitted" || status === "streaming";

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Ajuda"
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm text-primary-foreground shadow-lg print:hidden"
      >
        {open ? <X className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />} Ajuda
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[70vh] w-[min(420px,calc(100vw-2.5rem))] flex-col border border-border bg-background shadow-xl print:hidden">
          <div className="border-b border-border px-4 py-3">
            <p className="eyebrow">Ajuda</p>
            <p className="font-serif text-lg">Converse com a assistente</p>
          </div>
          <Conversation className="flex-1">
            <ConversationContent>
              {messages.length === 0 ? (
                <ConversationEmptyState title="Como posso ajudar?" description="Pergunte sobre editais, orçamento, acessibilidade ou como usar o app." />
              ) : (
                messages.map((m) => (
                  <Message key={m.id} from={m.role}>
                    <MessageContent className={m.role === "user" ? "bg-primary text-primary-foreground" : ""}>
                      {m.parts.map((p, i) => (p.type === "text" ? <MessageResponse key={i}>{p.text}</MessageResponse> : null))}
                    </MessageContent>
                  </Message>
                ))
              )}
              {status === "submitted" && <Shimmer>Pensando…</Shimmer>}
            </ConversationContent>
            <ConversationScrollButton />
          </Conversation>
          <div className="p-3">
            <PromptInput
              onSubmit={(msg) => {
                const text = msg.text?.trim();
                if (text && !busy) sendMessage({ text });
              }}
            >
              <PromptInputTextarea placeholder="Escreva sua dúvida…" />
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={status} onStop={stop} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </div>
      )}
    </>
  );
}
