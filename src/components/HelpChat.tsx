import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { PromptCard } from "@/components/PromptCard";
import { HELP_INSTRUCTIONS, composePrompt } from "@/lib/prompts";

export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const text = question.trim();

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
        <div className="fixed bottom-20 right-5 z-40 flex max-h-[80vh] w-[min(460px,calc(100vw-2.5rem))] flex-col gap-4 overflow-y-auto border border-border bg-background p-4 shadow-xl print:hidden">
          <div>
            <p className="eyebrow">Ajuda</p>
            <p className="font-serif text-lg">Tire sua dúvida no seu chat de IA</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Escreva a dúvida, copie o texto pronto e cole no Claude, ChatGPT ou Gemini que você já
              usa.
            </p>
          </div>
          <Textarea
            aria-label="Sua dúvida"
            placeholder="Ex.: o que é contrapartida social e como eu escrevo a minha?"
            className="min-h-24 bg-paper"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          {text && (
            <PromptCard prompt={composePrompt(HELP_INSTRUCTIONS, `Minha dúvida:\n${text}`)} />
          )}
        </div>
      )}
    </>
  );
}
