import { useState } from "react";
import type { TemplateId } from "@curriculo/shared";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createResumeRequest } from "../models/resumes";
import { TemplateSelector } from "../views/editor/TemplateSelector";

export const NewResumePage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("Meu currículo");
  const [templateId, setTemplateId] = useState<TemplateId>("minimal");

  const mutation = useMutation({
    mutationFn: createResumeRequest,
    onSuccess: (resume) => {
      navigate(`/app/resumes/${resume.id}/edit`);
    }
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-bold text-ink">Novo currículo</h1>
        <p className="text-sm text-ink/70">Escolha um template e comece a edição.</p>
      </header>

      <article className="rounded-3xl border border-teal/20 bg-white p-5">
        <label className="block text-sm font-semibold text-ink/80">
          Título do currículo
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2"
          />
        </label>
      </article>

      <article className="rounded-3xl border border-teal/20 bg-white p-5">
        <h2 className="font-heading text-xl font-bold text-ink">Escolha de template</h2>
        <div className="mt-4">
          <TemplateSelector value={templateId} onChange={setTemplateId} />
        </div>
      </article>

      <button
        type="button"
        disabled={mutation.isPending || !title.trim()}
        onClick={() => mutation.mutate({ title: title.trim(), templateId })}
        className="rounded-full bg-teal px-5 py-2.5 font-semibold text-white disabled:opacity-60"
      >
        {mutation.isPending ? "Criando..." : "Criar e abrir editor"}
      </button>
    </section>
  );
};

