import { useState } from "react";
import type { ResumeVersionDto } from "@curriculo/shared";

interface VersionsPanelProps {
  versions: ResumeVersionDto[];
  loading: boolean;
  creating: boolean;
  restoringVersionId: string | null;
  onCreate: (name: string) => void;
  onRestore: (versionId: string) => void;
}

export const VersionsPanel = ({
  versions,
  loading,
  creating,
  restoringVersionId,
  onCreate,
  onRestore
}: VersionsPanelProps) => {
  const [name, setName] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      return;
    }

    onCreate(name.trim());
    setName("");
  };

  return (
    <section className="rounded-3xl border border-teal/20 bg-white p-4">
      <h2 className="font-heading text-base font-bold text-ink">Versões</h2>

      <div className="mt-3 flex gap-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Versão para vaga X"
          className="flex-1 rounded-xl border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleCreate}
          disabled={creating}
          className="rounded-xl bg-teal px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {creating ? "Salvando..." : "Salvar snapshot"}
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {loading && <p className="text-sm text-ink/60">Carregando versões...</p>}
        {!loading && versions.length === 0 && <p className="text-sm text-ink/60">Sem versões ainda.</p>}

        {versions.map((version) => (
          <div
            key={version.id}
            className="flex items-center justify-between rounded-xl border border-black/10 px-3 py-2"
          >
            <div>
              <p className="text-sm font-semibold">{version.name}</p>
              <p className="text-xs text-ink/60">
                {new Date(version.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onRestore(version.id)}
              disabled={restoringVersionId === version.id}
              className="rounded-lg border border-ink/20 px-2 py-1 text-xs font-semibold text-ink"
            >
              {restoringVersionId === version.id ? "Restaurando..." : "Restaurar"}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

