import type { ResumeTheme } from "@curriculo/shared";

interface ThemePanelProps {
  theme: ResumeTheme;
  onChange: (theme: ResumeTheme) => void;
}

export const ThemePanel = ({ theme, onChange }: ThemePanelProps) => {
  return (
    <section className="rounded-3xl border border-teal/20 bg-white p-4">
      <h2 className="font-heading text-base font-bold text-ink">Tema</h2>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-ink/70">
          Cor primária
          <input
            className="mt-1 h-10 w-full rounded-xl border border-black/10 p-1"
            type="color"
            value={theme.primaryColor}
            onChange={(event) => onChange({ ...theme, primaryColor: event.target.value })}
          />
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Cor secundária
          <input
            className="mt-1 h-10 w-full rounded-xl border border-black/10 p-1"
            type="color"
            value={theme.secondaryColor}
            onChange={(event) => onChange({ ...theme, secondaryColor: event.target.value })}
          />
        </label>
        <label className="text-xs font-semibold text-ink/70">
          Cor de texto
          <input
            className="mt-1 h-10 w-full rounded-xl border border-black/10 p-1"
            type="color"
            value={theme.textColor}
            onChange={(event) => onChange({ ...theme, textColor: event.target.value })}
          />
        </label>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-xs font-semibold text-ink/70">
          Fonte
          <select
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            value={theme.font}
            onChange={(event) =>
              onChange({ ...theme, font: event.target.value as ResumeTheme["font"] })
            }
          >
            <option value="sourceSans">Source Sans</option>
            <option value="merriweather">Merriweather</option>
            <option value="montserrat">Montserrat</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-ink/70">
          Espaçamento
          <select
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            value={theme.spacing}
            onChange={(event) =>
              onChange({ ...theme, spacing: event.target.value as ResumeTheme["spacing"] })
            }
          >
            <option value="compact">Compacto</option>
            <option value="comfortable">Confortável</option>
          </select>
        </label>

        <label className="text-xs font-semibold text-ink/70">
          Tamanho de fonte
          <select
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
            value={theme.fontSizeLevel}
            onChange={(event) =>
              onChange({
                ...theme,
                fontSizeLevel: event.target.value as ResumeTheme["fontSizeLevel"]
              })
            }
          >
            <option value="normal">Normal</option>
            <option value="large">Grande</option>
          </select>
        </label>
      </div>
    </section>
  );
};

