import { useState } from "react";

export function LanguagePicker({ value, onChange, options }: { value: string[]; onChange: (v: string[]) => void; options: string[] }) {
  const [custom, setCustom] = useState("");
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const toggle = (l: string) => onChange(value.includes(l) ? value.filter((x) => x !== l) : [...value, l]);
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {all.map((l) => (
          <button
            type="button"
            key={l}
            onClick={() => toggle(l)}
            className={`rounded-full border px-3 py-1 text-xs ${value.includes(l) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-foreground/40"}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Outra linguagem ou categoria"
          className="h-8 flex-1 rounded-sm border border-input bg-paper px-2 text-xs"
        />
        <button
          type="button"
          className="text-xs underline"
          onClick={() => {
            if (custom.trim() && !value.includes(custom.trim())) onChange([...value, custom.trim()]);
            setCustom("");
          }}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}
