import type { HeaderContent } from "@curriculo/shared";

interface HeaderEditorProps {
  header: HeaderContent;
  onChange: (header: HeaderContent) => void;
}

const fields: Array<{ key: keyof HeaderContent; label: string }> = [
  { key: "fullName", label: "Nome" },
  { key: "role", label: "Cargo" },
  { key: "email", label: "E-mail" },
  { key: "phone", label: "Telefone" },
  { key: "location", label: "Localização" },
  { key: "website", label: "Website" },
  { key: "linkedIn", label: "LinkedIn" },
  { key: "github", label: "GitHub" }
];

export const HeaderEditor = ({ header, onChange }: HeaderEditorProps) => {
  return (
    <section className="rounded-3xl border border-teal/20 bg-white p-4">
      <h2 className="font-heading text-base font-bold text-ink">Cabeçalho</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} className="text-xs font-semibold text-ink/70">
            {field.label}
            <input
              value={header[field.key]}
              onChange={(event) =>
                onChange({
                  ...header,
                  [field.key]: event.target.value
                })
              }
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            />
          </label>
        ))}
      </div>
    </section>
  );
};

