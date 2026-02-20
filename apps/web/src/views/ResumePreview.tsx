import { useEffect, useMemo, useRef, useState } from "react";
import type { ResumeDto, ResumeSection } from "@curriculo/shared";
import { CreativeTemplate } from "./templates/CreativeTemplate";
import { ExecutiveTemplate } from "./templates/ExecutiveTemplate";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";

const PAGE_WIDTH = 794;
const A4_PAGE_HEIGHT = 1123;
const MIN_PAGE_HEIGHT = A4_PAGE_HEIGHT;
const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const reorderSections = (
  sections: ResumeSection[],
  sourceId: string,
  targetId: string
): ResumeSection[] => {
  const sourceIndex = sections.findIndex((section) => section.id === sourceId);
  const targetIndex = sections.findIndex((section) => section.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return sections;
  }

  const next = [...sections];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
};

const moveSectionToEnd = (sections: ResumeSection[], sourceId: string): ResumeSection[] => {
  const sourceIndex = sections.findIndex((section) => section.id === sourceId);

  if (sourceIndex < 0 || sourceIndex === sections.length - 1) {
    return sections;
  }

  const next = [...sections];
  const [moved] = next.splice(sourceIndex, 1);
  next.push(moved);
  return next;
};

const setSectionPageBreak = (
  sections: ResumeSection[],
  sectionId: string,
  pageBreakBefore: boolean
): ResumeSection[] =>
  sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          pageBreakBefore
        }
      : section
  );

const setSectionColumn = (
  sections: ResumeSection[],
  sectionId: string,
  column: "auto" | "left" | "right"
): ResumeSection[] =>
  sections.map((section) =>
    section.id === sectionId
      ? {
          ...section,
          layoutColumn: column
        }
      : section
  );

const clearAllSectionPageBreaks = (sections: ResumeSection[]): ResumeSection[] =>
  sections.map((section) => ({
    ...section,
    pageBreakBefore: false
  }));

const sectionSnippet = (section: ResumeSection): string => {
  const firstItem = section.items[0];

  if (!firstItem) {
    return "Sem conteudo";
  }

  const text = Object.values(firstItem.fields).filter(Boolean).join(" - ").trim();
  if (!text) {
    return "Sem conteudo";
  }

  return text.length > 88 ? `${text.slice(0, 88)}...` : text;
};

interface ResumePreviewProps {
  resume: ResumeDto;
  onSectionsReorder?: (sections: ResumeSection[]) => void;
}

export const ResumePreview = ({ resume, onSectionsReorder }: ResumePreviewProps) => {
  const [zoom, setZoom] = useState(1);
  const [pageHeight, setPageHeight] = useState(MIN_PAGE_HEIGHT);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showOrganizer, setShowOrganizer] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const pageRef = useRef<HTMLDivElement | null>(null);
  const canReorder = Boolean(onSectionsReorder);
  const zoomLabel = `${Math.round(zoom * 100)}%`;
  const scaledWidth = Math.round(PAGE_WIDTH * zoom);
  const scaledHeight = Math.round(pageHeight * zoom);
  const pageCount = Math.max(1, Math.ceil(pageHeight / A4_PAGE_HEIGHT));
  const scaledA4Height = Math.round(A4_PAGE_HEIGHT * zoom);
  const previewCanvasHeight = Math.max(scaledHeight, pageCount * scaledA4Height);

  const renderedTemplate = useMemo(() => {
    if (resume.templateId === "minimal") {
      return <MinimalTemplate resume={resume} />;
    }

    if (resume.templateId === "modern") {
      return <ModernTemplate resume={resume} />;
    }

    if (resume.templateId === "professional") {
      return <ProfessionalTemplate resume={resume} />;
    }

    if (resume.templateId === "executive") {
      return <ExecutiveTemplate resume={resume} />;
    }

    return <CreativeTemplate resume={resume} />;
  }, [resume]);

  useEffect(() => {
    const node = pageRef.current;
    if (!node) {
      return;
    }

    const readHeight = () => {
      const nextHeight = Math.max(MIN_PAGE_HEIGHT, Math.ceil(node.scrollHeight));
      setPageHeight(nextHeight);
    };

    readHeight();

    const observer = new ResizeObserver(() => {
      readHeight();
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [resume]);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isExpanded]);

  const applyReorder = (targetId: string) => {
    if (!draggingId || !onSectionsReorder) {
      return;
    }

    const next = reorderSections(resume.content.sections, draggingId, targetId);
    if (next !== resume.content.sections) {
      onSectionsReorder(next);
    }

    setDraggingId(null);
    setDragOverId(null);
  };

  const applyMoveToEnd = () => {
    if (!draggingId || !onSectionsReorder) {
      return;
    }

    const next = moveSectionToEnd(resume.content.sections, draggingId);
    if (next !== resume.content.sections) {
      onSectionsReorder(next);
    }

    setDraggingId(null);
    setDragOverId(null);
  };

  const applyMoveToColumn = (column: "left" | "right") => {
    if (!draggingId || !onSectionsReorder) {
      return;
    }

    const next = setSectionColumn(resume.content.sections, draggingId, column);
    onSectionsReorder(next);

    setDraggingId(null);
    setDragOverId(null);
  };

  const toggleSectionPageBreak = (sectionId: string, enabled: boolean) => {
    if (!onSectionsReorder) {
      return;
    }

    const next = setSectionPageBreak(resume.content.sections, sectionId, enabled);
    onSectionsReorder(next);
  };

  const clearPageBreaks = () => {
    if (!onSectionsReorder) {
      return;
    }

    onSectionsReorder(clearAllSectionPageBreaks(resume.content.sections));
  };

  const autoPaginateForA4 = () => {
    if (!onSectionsReorder || !pageRef.current) {
      return;
    }

    const sectionElements = Array.from(
      pageRef.current.querySelectorAll<HTMLElement>("[data-section-id]")
    );

    const measuredHeightBySectionId = new Map<string, number>();
    for (const element of sectionElements) {
      const sectionId = element.dataset.sectionId;
      if (!sectionId || measuredHeightBySectionId.has(sectionId)) {
        continue;
      }

      measuredHeightBySectionId.set(sectionId, Math.max(80, Math.ceil(element.offsetHeight)));
    }

    let accumulatedHeight = 0;

    const next = resume.content.sections.map((section) => {
      const sectionHeight = measuredHeightBySectionId.get(section.id) ?? 180;
      const fitsOnePage = sectionHeight < A4_PAGE_HEIGHT * 0.92;

      let pageBreakBefore = false;
      if (accumulatedHeight > 0 && fitsOnePage && accumulatedHeight + sectionHeight > A4_PAGE_HEIGHT) {
        pageBreakBefore = true;
        accumulatedHeight = 0;
      }

      accumulatedHeight += Math.min(sectionHeight + 10, A4_PAGE_HEIGHT);

      return {
        ...section,
        pageBreakBefore
      };
    });

    onSectionsReorder(next);
  };

  const renderA4Preview = (options: { maxHeightClass: string; measureHeight: boolean }) => (
    <div className={`${options.maxHeightClass} overflow-auto rounded-xl border border-black/10 bg-slate-100 p-3`}>
      <div className="relative mx-auto" style={{ width: `${scaledWidth}px`, height: `${previewCanvasHeight}px` }}>
        {Array.from({ length: Math.max(0, pageCount - 1) }).map((_, index) => (
          <div
            key={`page-break-${index}`}
            className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-dashed border-black/25"
            style={{ top: `${scaledA4Height * (index + 1)}px` }}
          />
        ))}

        <div
          ref={options.measureHeight ? pageRef : undefined}
          className="origin-top-left bg-white shadow-md"
          style={{
            width: `${PAGE_WIDTH}px`,
            minHeight: `${MIN_PAGE_HEIGHT}px`,
            transform: `scale(${zoom})`
          }}
        >
          {renderedTemplate}
        </div>
      </div>
    </div>
  );

  const renderOrganizer = () => (
    <div className="rounded-xl border border-black/10 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">Organizar secoes</p>
      <p className="mt-1 text-xs text-ink/60">Arraste para cima, baixo ou para os lados.</p>
      <p className="mt-0.5 text-[11px] text-ink/50">Dica: use os alvos de coluna para mandar um bloco para a direita mesmo com lado vazio.</p>

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={autoPaginateForA4}
          className="rounded-full border border-black/15 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-ink/80"
        >
          Ajustar A4 automatico
        </button>
        <button
          type="button"
          onClick={clearPageBreaks}
          className="rounded-full border border-black/15 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-ink/80"
        >
          Limpar quebras
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {resume.content.sections.map((section, index) => (
          <article
            key={section.id}
            draggable={canReorder}
            onDragStart={() => {
              if (!canReorder) {
                return;
              }

              setDraggingId(section.id);
              setDragOverId(section.id);
            }}
            onDragOver={(event) => {
              if (!canReorder || !draggingId) {
                return;
              }

              event.preventDefault();
              setDragOverId(section.id);
            }}
            onDrop={(event) => {
              event.preventDefault();
              applyReorder(section.id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOverId(null);
            }}
            className={`rounded-lg border bg-slate-50 p-2 text-left transition ${
              dragOverId === section.id ? "border-teal bg-teal/10" : "border-black/10"
            }`}
          >
            <p className="text-xs font-semibold text-ink/70">
              {index + 1}. {section.title}
            </p>
            <p className="mt-1 text-[11px] text-ink/60">{sectionSnippet(section)}</p>
            <p className="mt-1 text-[11px] font-semibold text-ink/55">
              Coluna:{" "}
              {section.layoutColumn === "left"
                ? "Esquerda"
                : section.layoutColumn === "right"
                  ? "Direita"
                  : "Automatica"}
            </p>
            <button
              type="button"
              onMouseDown={(event) => event.stopPropagation()}
              onClick={() => toggleSectionPageBreak(section.id, !section.pageBreakBefore)}
              className={`mt-2 rounded-full border px-2 py-1 text-[11px] font-semibold ${
                section.pageBreakBefore
                  ? "border-teal bg-teal/10 text-teal-900"
                  : "border-black/15 bg-white text-ink/70"
              }`}
            >
              {section.pageBreakBefore ? "Quebra de pagina ativa" : "Iniciar nova pagina no PDF"}
            </button>
          </article>
        ))}
      </div>

      <div
        onDragOver={(event) => {
          if (!canReorder || !draggingId) {
            return;
          }

          event.preventDefault();
          setDragOverId("__end__");
        }}
        onDrop={(event) => {
          event.preventDefault();
          applyMoveToEnd();
        }}
        className={`mt-2 rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
          dragOverId === "__end__" ? "border-teal bg-teal/10 text-teal-900" : "border-dashed border-black/20 text-ink/60"
        }`}
      >
        Solte aqui para enviar para o final
      </div>

      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <div
          onDragOver={(event) => {
            if (!canReorder || !draggingId) {
              return;
            }

            event.preventDefault();
            setDragOverId("__left__");
          }}
          onDrop={(event) => {
            event.preventDefault();
            applyMoveToColumn("left");
          }}
          className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
            dragOverId === "__left__"
              ? "border-teal bg-teal/10 text-teal-900"
              : "border-dashed border-black/20 text-ink/60"
          }`}
        >
          Solte para forcar coluna esquerda
        </div>

        <div
          onDragOver={(event) => {
            if (!canReorder || !draggingId) {
              return;
            }

            event.preventDefault();
            setDragOverId("__right__");
          }}
          onDrop={(event) => {
            event.preventDefault();
            applyMoveToColumn("right");
          }}
          className={`rounded-lg border px-2 py-2 text-center text-xs font-semibold ${
            dragOverId === "__right__"
              ? "border-teal bg-teal/10 text-teal-900"
              : "border-dashed border-black/20 text-ink/60"
          }`}
        >
          Solte para forcar coluna direita
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-full min-w-0 rounded-3xl border border-black/10 bg-slate-200 p-3 shadow-lg">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">Visualizacao</p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoom((value) => clamp(Number((value - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
              className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
            >
              -
            </button>
            <span className="min-w-12 text-center text-xs font-semibold text-ink/80">{zoomLabel}</span>
            <button
              type="button"
              onClick={() => setZoom((value) => clamp(Number((value + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
              className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoom(1)}
              className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
            >
              100%
            </button>
            <span className="ml-1 text-[11px] font-semibold text-ink/60">A4: {pageCount} p.</span>
            <button
              type="button"
              onClick={() => setIsExpanded(true)}
              className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
            >
              Ampliar
            </button>
          </div>
        </div>

        {renderA4Preview({ maxHeightClass: "max-h-[calc(100vh-10rem)]", measureHeight: true })}
      </div>

      {isExpanded && (
        <div className="fixed inset-0 z-50 bg-black/45 p-4">
          <div className="mx-auto flex h-full w-[min(96vw,1700px)] flex-col rounded-2xl border border-black/10 bg-slate-200 p-3 shadow-2xl">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
                Preview ampliado (A4)
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setZoom((value) => clamp(Number((value - ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
                  className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                >
                  -
                </button>
                <span className="min-w-12 text-center text-xs font-semibold text-ink/80">{zoomLabel}</span>
                <button
                  type="button"
                  onClick={() => setZoom((value) => clamp(Number((value + ZOOM_STEP).toFixed(2)), MIN_ZOOM, MAX_ZOOM))}
                  className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => setZoom(1)}
                  className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                >
                  100%
                </button>
                <span className="ml-1 text-[11px] font-semibold text-ink/60">A4: {pageCount} p.</span>
                {canReorder && (
                  <button
                    type="button"
                    onClick={() => setShowOrganizer((value) => !value)}
                    className="ml-1 rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                  >
                    {showOrganizer ? "Ocultar arraste" : "Arrastar secoes"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="rounded-full border border-black/15 bg-white px-2 py-0.5 text-xs font-semibold text-ink"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-h-0">{renderA4Preview({ maxHeightClass: "h-full", measureHeight: false })}</div>
              {canReorder && showOrganizer && <div className="min-h-0 overflow-auto">{renderOrganizer()}</div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
