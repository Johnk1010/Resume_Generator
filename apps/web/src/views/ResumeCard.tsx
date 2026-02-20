import { Link } from "react-router-dom";
import type { ResumeDto } from "@curriculo/shared";

interface ResumeCardProps {
  resume: ResumeDto;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (resume: ResumeDto) => void;
}

const templateLabelMap: Record<ResumeDto["templateId"], string> = {
  minimal: "Minimalista",
  modern: "Moderno",
  professional: "Profissional"
};

export const ResumeCard = ({ resume, onDuplicate, onDelete, onRename }: ResumeCardProps) => {
  return (
    <article className="group rounded-3xl border border-teal/20 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-glow">
      <h3 className="font-heading text-lg font-bold text-ink">{resume.title}</h3>
      <p className="mt-1 text-sm text-ink/70">Template: {templateLabelMap[resume.templateId]}</p>
      <p className="mt-1 text-xs text-ink/50">
        Atualizado em {new Date(resume.updatedAt).toLocaleString("pt-BR")}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          to={`/app/resumes/${resume.id}/edit`}
          className="rounded-full bg-teal px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-teal/90"
        >
          Editar
        </Link>
        <button
          onClick={() => onRename(resume)}
          className="rounded-full border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-teal"
        >
          Renomear
        </button>
        <button
          onClick={() => onDuplicate(resume.id)}
          className="rounded-full border border-ink/20 px-3 py-1.5 text-sm font-semibold text-ink transition hover:border-teal"
        >
          Duplicar
        </button>
        <button
          onClick={() => onDelete(resume.id)}
          className="rounded-full border border-coral/40 px-3 py-1.5 text-sm font-semibold text-coral transition hover:bg-coral/10"
        >
          Excluir
        </button>
      </div>
    </article>
  );
};

