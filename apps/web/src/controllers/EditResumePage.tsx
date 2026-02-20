import { useCallback, useEffect, useMemo, useState } from "react";
import type { ResumeDto, UpdateResumeInput } from "@curriculo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  createVersionRequest,
  downloadExportRequest,
  getResumeRequest,
  listVersionsRequest,
  restoreVersionRequest,
  updateResumeRequest
} from "../models/resumes";
import { HeaderEditor } from "../views/editor/HeaderEditor";
import { SectionEditor } from "../views/editor/SectionEditor";
import { TemplateSelector } from "../views/editor/TemplateSelector";
import { ThemePanel } from "../views/editor/ThemePanel";
import { VersionsPanel } from "../views/editor/VersionsPanel";
import { ResumePreview } from "../views/ResumePreview";

const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const buildPayload = (resume: ResumeDto): UpdateResumeInput => ({
  title: resume.title,
  templateId: resume.templateId,
  content: resume.content,
  theme: resume.theme
});

export const EditResumePage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ResumeDto | null>(null);
  const [dirty, setDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const resumeQuery = useQuery({
    queryKey: ["resume", id],
    queryFn: () => getResumeRequest(id!),
    enabled: Boolean(id)
  });

  const versionsQuery = useQuery({
    queryKey: ["versions", id],
    queryFn: () => listVersionsRequest(id!),
    enabled: Boolean(id)
  });

  useEffect(() => {
    if (resumeQuery.data) {
      setDraft(resumeQuery.data);
      setDirty(false);
      setStatusError(null);
    }
  }, [resumeQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateResumeInput) => updateResumeRequest(id!, payload),
    onSuccess: (updated) => {
      setDraft(updated);
      setDirty(false);
      setLastSavedAt(new Date());
      setStatusError(null);
      queryClient.setQueryData(["resume", id], updated);
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    },
    onError: (error) => {
      setStatusError(error instanceof Error ? error.message : "Erro ao salvar currículo");
    }
  });

  const createVersionMutation = useMutation({
    mutationFn: (name: string) => createVersionRequest(id!, { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["versions", id] });
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => restoreVersionRequest(id!, versionId),
    onSuccess: (restored) => {
      setDraft(restored);
      setDirty(false);
      setStatusError(null);
      void queryClient.invalidateQueries({ queryKey: ["resume", id] });
      void queryClient.invalidateQueries({ queryKey: ["versions", id] });
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
    }
  });

  const saveNow = useCallback(() => {
    if (!draft || !dirty || !id || saveMutation.isPending) {
      return;
    }

    saveMutation.mutate(buildPayload(draft));
  }, [dirty, draft, id, saveMutation]);

  useEffect(() => {
    if (!dirty) {
      return;
    }

    const timer = window.setInterval(() => {
      saveNow();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [dirty, saveNow]);

  useEffect(() => {
    const handler = () => {
      if (!draft || !dirty || !id) {
        return;
      }

      void updateResumeRequest(id, buildPayload(draft)).catch(() => {
        // best effort save before unload
      });
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty, draft, id]);

  const handleDownload = async (format: "pdf") => {
    if (!id) {
      return;
    }

    try {
      const { blob, fileName } = await downloadExportRequest(id, format);
      downloadBlob(blob, fileName);
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : "Falha ao exportar arquivo");
    }
  };

  const statusLabel = useMemo(() => {
    if (saveMutation.isPending) {
      return "Salvando...";
    }

    if (dirty) {
      return "Alterações não salvas";
    }

    if (lastSavedAt) {
      return `Último autosave: ${lastSavedAt.toLocaleTimeString("pt-BR")}`;
    }

    return "Tudo salvo";
  }, [dirty, lastSavedAt, saveMutation.isPending]);

  if (!id) {
    return <p className="text-sm text-red-600">ID de currículo inválido.</p>;
  }

  if (resumeQuery.isLoading || !draft) {
    return <p className="text-sm text-ink/70">Carregando currículo...</p>;
  }

  if (resumeQuery.isError) {
    return <p className="text-sm text-red-600">Não foi possível carregar o currículo.</p>;
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4">
        <article className="rounded-3xl border border-teal/20 bg-white p-4">
          <h1 className="font-heading text-2xl font-bold text-ink">Editor</h1>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-semibold text-ink/70">
              Título do currículo
              <input
                value={draft.title}
                onChange={(event) => {
                  setDraft({ ...draft, title: event.target.value });
                  setDirty(true);
                }}
                className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
            </label>
            <div className="text-xs font-semibold text-ink/70">
              Status
              <div className="mt-1 rounded-xl border border-black/10 bg-slate-50 px-3 py-2 text-sm text-ink/80">
                {statusLabel}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={saveNow}
              disabled={saveMutation.isPending || !dirty}
              className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Salvar agora
            </button>
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold"
            >
              Exportar PDF
            </button>
          </div>

          {statusError && <p className="mt-3 text-sm text-red-600">{statusError}</p>}
        </article>

        <article className="rounded-3xl border border-teal/20 bg-white p-4">
          <h2 className="font-heading text-base font-bold text-ink">Template</h2>
          <div className="mt-3">
            <TemplateSelector
              value={draft.templateId}
              onChange={(templateId) => {
                setDraft({ ...draft, templateId });
                setDirty(true);
              }}
            />
          </div>
        </article>

        <HeaderEditor
          header={draft.content.header}
          onChange={(header) => {
            setDraft({
              ...draft,
              content: {
                ...draft.content,
                header
              }
            });
            setDirty(true);
          }}
        />

        <ThemePanel
          theme={draft.theme}
          onChange={(theme) => {
            setDraft({ ...draft, theme });
            setDirty(true);
          }}
        />

        <SectionEditor
          sections={draft.content.sections}
          onChange={(sections) => {
            setDraft({
              ...draft,
              content: {
                ...draft.content,
                sections
              }
            });
            setDirty(true);
          }}
        />

        <VersionsPanel
          versions={versionsQuery.data ?? []}
          loading={versionsQuery.isLoading}
          creating={createVersionMutation.isPending}
          restoringVersionId={restoringVersionId}
          onCreate={(name) => createVersionMutation.mutate(name)}
          onRestore={(versionId) => {
            setRestoringVersionId(versionId);
            restoreMutation.mutate(versionId, {
              onSettled: () => setRestoringVersionId(null)
            });
          }}
        />
      </div>

      <aside className="xl:sticky xl:top-6 xl:h-fit">
        <h2 className="mb-2 font-heading text-xl font-bold text-ink">Preview</h2>
        <ResumePreview resume={draft} />
      </aside>
    </section>
  );
};

