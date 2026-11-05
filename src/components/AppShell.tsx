import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HelpChat } from "./HelpChat";

const NAV = [
  { to: "/painel", label: "Visão geral", n: "01" },
  { to: "/projetos", label: "Meus projetos", n: "02" },
  { to: "/projetos/novo", label: "Novo projeto", n: "03" },
  { to: "/modelos", label: "Modelos de edital", n: "04" },
  { to: "/editais", label: "Biblioteca de editais", n: "05" },
  { to: "/referencias", label: "Biblioteca de referências", n: "06" },
  { to: "/radar", label: "Radar de oportunidades", n: "07" },
  { to: "/configuracoes", label: "Configurações", n: "08" },
] as const;

export function AppShell() {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();
  const navigate = useNavigate();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((i) => (
        <Link
          key={i.to}
          to={i.to}
          onClick={() => setOpen(false)}
          activeOptions={{ exact: i.to === "/projetos" }}
          className="group flex items-baseline gap-3 rounded-sm px-3 py-2 text-sm rounded-full text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[status=active]:bg-sidebar-primary data-[status=active]:text-sidebar-primary-foreground"
        >
          <span className="font-serif text-xs opacity-70">{i.n}</span>
          {i.label}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-5 md:sticky md:top-0 md:flex md:h-screen md:flex-col print:hidden">
        <Link to="/painel" className="mb-8 block px-3 font-serif text-2xl font-semibold text-sidebar-foreground">ateliê<br /><span className="text-sidebar-primary">cultural</span></Link>
        {nav}
        <button onClick={signOut} className="mt-auto px-3 text-left text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground">Sair</button>
      </aside>
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden print:hidden">
        <Link to="/painel" className="font-serif text-lg">Ateliê Cultural</Link>
        <button aria-label="Menu" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
      </header>
      {open && (
        <div className="border-b border-border bg-sidebar p-4 text-sidebar-foreground md:hidden print:hidden">
          {nav}
          <button onClick={signOut} className="mt-3 px-3 text-xs text-sidebar-foreground/70">Sair</button>
        </div>
      )}
      <main className="min-w-0 px-5 py-8 md:px-12 md:py-12">
        <Outlet />
      </main>
      <HelpChat />
    </div>
  );
}

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-primary pb-5">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 text-3xl font-semibold text-primary md:text-4xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}
