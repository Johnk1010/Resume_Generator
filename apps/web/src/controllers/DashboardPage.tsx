import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ResumeDto } from "@curriculo/shared";
import {
  deleteResumeRequest,
  duplicateResumeRequest,
  listResumesRequest,
  updateResumeRequest
} from "../models/resumes";
import { ResumeCard } from "../views/ResumeCard";

export const DashboardPage = () => {
  const queryClient = useQueryClient();

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: listResumesRequest
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateResumeRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteResumeRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => updateResumeRequest(id, { title }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  const handleDelete = (id: string) => {
    if (!window.confirm("Deseja mesmo excluir este currículo?")) {
      return;
    }

    deleteMutation.mutate(id);
  };

  const handleRename = (resume: ResumeDto) => {
    const nextTitle = window.prompt("Novo nome do currículo:", resume.title);
    if (!nextTitle?.trim()) {
      return;
    }

    renameMutation.mutate({ id: resume.id, title: nextTitle.trim() });
  };

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink">Seus currículos</h1>
          <p className="text-sm text-ink/70">Gerencie versões e personalize para cada vaga.</p>
        </div>
        <Link
          to="/app/resumes/new"
          className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white transition hover:bg-coral/90"
        >
          + Novo currículo
        </Link>
      </div>

      {resumesQuery.isLoading && <p className="text-sm text-ink/70">Carregando currículos...</p>}
      {resumesQuery.isError && (
        <p className="text-sm text-red-600">Falha ao carregar currículos.</p>
      )}

      {!resumesQuery.isLoading && resumesQuery.data?.length === 0 && (
        <div className="rounded-3xl border border-teal/20 bg-white p-6 text-center">
          <p className="text-ink/70">Você ainda não tem currículos. Crie o primeiro agora.</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {resumesQuery.data?.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            onDuplicate={(id) => duplicateMutation.mutate(id)}
            onDelete={handleDelete}
            onRename={handleRename}
          />
        ))}
      </div>
    </section>
  );
};

