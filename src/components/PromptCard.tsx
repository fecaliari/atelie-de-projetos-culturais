import { useRef } from "react";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const CHATS = [
  { name: "Claude", href: "https://claude.ai/new" },
  { name: "ChatGPT", href: "https://chatgpt.com/" },
  { name: "Gemini", href: "https://gemini.google.com/app" },
];

export function PromptCard({ prompt, hint }: { prompt: string; hint?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(prompt);
      toast.success("Texto copiado. Agora cole no chat.");
    } catch {
      ref.current?.select();
      toast.message("Não deu pra copiar sozinho. O texto está selecionado: use Ctrl+C.");
    }
  }

  return (
    <div className="space-y-3 border border-border bg-paper p-4 print:hidden">
      <p className="text-sm text-muted-foreground">
        {hint ??
          "Copie o texto abaixo e cole no chat de IA que você já usa. O app não envia nada por você."}
      </p>
      <Textarea
        ref={ref}
        readOnly
        aria-label="Texto para colar no chat de IA"
        className="min-h-40 bg-background text-xs"
        value={prompt}
        onFocus={(e) => e.currentTarget.select()}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={copy}>
          <Copy className="size-4" />
          Copiar texto
        </Button>
        {CHATS.map((c) => (
          <Button key={c.name} variant="outline" asChild>
            <a href={c.href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Abrir {c.name}
            </a>
          </Button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          {prompt.length.toLocaleString("pt-BR")} caracteres
        </span>
      </div>
    </div>
  );
}
