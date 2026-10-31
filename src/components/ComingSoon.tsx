import { PageHeader } from "@/components/AppShell";

export function ComingSoon({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="max-w-3xl">
      <PageHeader eyebrow={eyebrow} title={title} />
      <div className="border border-dashed border-border p-10">
        <p className="eyebrow">Em construção</p>
        <p className="mt-3 font-serif text-2xl font-light">{text}</p>
      </div>
    </div>
  );
}
