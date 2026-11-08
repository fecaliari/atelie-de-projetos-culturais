import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareTab({ project }: { project: Project }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const me = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user });
  const members = useQuery({
    queryKey: ["members", project.id],
    queryFn: async () => {
      const r = await supabase.from("project_members").select("*").eq("project_id", project.id).order("created_at");
      if (r.error) throw new Error(r.error.message);
      return r.data;
    },
  });
  const isOwner = me.data?.id === project.user_id;
  const refresh = () => qc.invalidateQueries({ queryKey: ["members", project.id] });

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const v = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(v)) return setErr("Digite um e-mail válido.");
    if (v === me.data?.email?.toLowerCase()) return setErr("Esse é o seu próprio e-mail.");
    const r = await supabase.from("project_members").insert({ project_id: project.id, email: v });
    if (r.error) return setErr(r.error.code === "23505" ? "Essa pessoa já foi convidada." : r.error.message);
    setEmail("");
    refresh();
  }
  async function remove(id: string) {
    await supabase.from("project_members").delete().eq("id", id);
    refresh();
  }

  return (
    <div className="max-w-xl space-y-6">
      <p className="text-sm text-muted-foreground">
        Quem você convidar pode ver e editar todo o projeto — perguntas, orçamento, cronograma, equipe e documentos. Só você pode convidar, remover pessoas ou apagar o projeto. A pessoa entra com o mesmo e-mail convidado (se ainda não tiver conta, basta criar uma).
      </p>
      {isOwner && (
        <form onSubmit={invite} className="flex gap-2">
          <Input type="email" placeholder="email@exemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-paper" />
          <Button type="submit">Convidar</Button>
        </form>
      )}
      {err && <p className="text-sm text-destructive">{err}</p>}
      <ul className="divide-y divide-border border-y border-border">
        <li className="flex justify-between py-3 text-sm"><span>{isOwner ? `${me.data?.email ?? ""} (você)` : "Dono do projeto"}</span><span className="text-muted-foreground">dono</span></li>
        {(members.data ?? []).map((m) => {
          const self = m.email === me.data?.email?.toLowerCase();
          return (
            <li key={m.id} className="flex items-center justify-between py-3 text-sm">
              <span>{m.email}{self && " (você)"}</span>
              {(isOwner || self) && (
                <button className="text-xs underline" onClick={() => remove(m.id)}>{self ? "Sair do projeto" : "Remover"}</button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
