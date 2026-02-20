import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ResumeSection, SectionType } from "@curriculo/shared";
import { createEmptyItem, getSectionFieldConfigs, sectionTypeOptions } from "../../models/utils/resume-editor";

interface SectionEditorProps {
  sections: ResumeSection[];
  onChange: (next: ResumeSection[]) => void;
}

const SortableSection = ({
  section,
  onChange,
  onRemove,
  onAddItem,
  onRemoveItem,
  onCustomFieldChange,
  onCustomFieldRename,
  onCustomFieldAdd
}: {
  section: ResumeSection;
  onChange: (next: ResumeSection) => void;
  onRemove: () => void;
  onAddItem: () => void;
  onRemoveItem: (itemId: string) => void;
  onCustomFieldChange: (itemId: string, key: string, value: string) => void;
  onCustomFieldRename: (itemId: string, oldKey: string, newKey: string) => void;
  onCustomFieldAdd: (itemId: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: section.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const fieldConfigs = getSectionFieldConfigs(section.type);

  return (
    <article ref={setNodeRef} style={style} className="rounded-2xl border border-black/10 bg-white p-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-lg border border-black/10 px-2 py-1 text-xs"
        >
          Arrastar
        </button>
        <input
          value={section.title}
          onChange={(event) => onChange({ ...section, title: event.target.value })}
          className="flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={onRemove}
          className="rounded-lg border border-coral/30 px-2 py-1 text-xs text-coral"
        >
          Remover seção
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {section.items.map((item) => (
          <div key={item.id} className="rounded-xl border border-black/10 bg-slate-50 p-3">
            {section.type !== "custom" && (
              <div className="grid gap-2">
                {fieldConfigs.map((field) => {
                  const InputComponent = field.multiline ? "textarea" : "input";

                  return (
                    <label key={field.key} className="text-xs font-semibold text-ink/70">
                      {field.label}
                      <InputComponent
                        value={item.fields[field.key] ?? ""}
                        onChange={(event) => {
                          const nextFields = { ...item.fields, [field.key]: event.target.value };
                          const nextItems = section.items.map((currentItem) =>
                            currentItem.id === item.id ? { ...currentItem, fields: nextFields } : currentItem
                          );
                          onChange({ ...section, items: nextItems });
                        }}
                        className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
                        rows={field.multiline ? 3 : undefined}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {section.type === "custom" && (
              <div className="space-y-2">
                {Object.entries(item.fields).map(([key, value]) => (
                  <div key={key} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
                    <input
                      value={key}
                      onChange={(event) => onCustomFieldRename(item.id, key, event.target.value)}
                      className="rounded-lg border border-black/10 px-2 py-2 text-xs"
                    />
                    <textarea
                      value={value}
                      rows={2}
                      onChange={(event) => onCustomFieldChange(item.id, key, event.target.value)}
                      className="rounded-lg border border-black/10 px-2 py-2 text-sm"
                    />
                    <button
                      type="button"
                      className="rounded-lg border border-coral/30 px-2 py-1 text-xs text-coral"
                      onClick={() => onCustomFieldChange(item.id, key, "")}
                    >
                      Limpar
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => onCustomFieldAdd(item.id)}
                  className="rounded-lg border border-black/10 px-2 py-1 text-xs"
                >
                  Novo campo
                </button>
              </div>
            )}

            <div className="mt-2 text-right">
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="rounded-lg border border-coral/30 px-2 py-1 text-xs text-coral"
              >
                Remover item
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onAddItem}
        className="mt-3 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold"
      >
        Adicionar item
      </button>
    </article>
  );
};

export const SectionEditor = ({ sections, onChange }: SectionEditorProps) => {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const sourceIndex = sections.findIndex((section) => section.id === active.id);
    const targetIndex = sections.findIndex((section) => section.id === over.id);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    onChange(arrayMove(sections, sourceIndex, targetIndex));
  };

  const updateSection = (sectionId: string, updater: (section: ResumeSection) => ResumeSection) => {
    onChange(sections.map((section) => (section.id === sectionId ? updater(section) : section)));
  };

  const removeSection = (sectionId: string) => {
    onChange(sections.filter((section) => section.id !== sectionId));
  };

  const addSection = (type: SectionType) => {
    onChange([
      ...sections,
      {
        id: crypto.randomUUID(),
        type,
        title: type === "custom" ? "Nova Seção" : sectionTypeOptions.find((option) => option.type === type)?.label ?? "Seção",
        items: [createEmptyItem(type)],
        pageBreakBefore: false,
        layoutColumn: "auto"
      }
    ]);
  };

  return (
    <section className="rounded-3xl border border-teal/20 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-base font-bold text-ink">Seções</h2>
        <div className="flex flex-wrap gap-2">
          {sectionTypeOptions.map((option) => (
            <button
              type="button"
              key={option.type}
              onClick={() => addSection(option.type)}
              className="rounded-full border border-black/10 px-3 py-1 text-xs font-semibold text-ink/80 hover:border-teal"
            >
              + {option.label}
            </button>
          ))}
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-4 space-y-3">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                onChange={(next) => updateSection(section.id, () => next)}
                onRemove={() => removeSection(section.id)}
                onAddItem={() =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    items: [...current.items, createEmptyItem(current.type)]
                  }))
                }
                onRemoveItem={(itemId) =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    items: current.items.filter((item) => item.id !== itemId)
                  }))
                }
                onCustomFieldChange={(itemId, key, value) =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    items: current.items.map((item) => {
                      if (item.id !== itemId) {
                        return item;
                      }

                      return {
                        ...item,
                        fields: {
                          ...item.fields,
                          [key]: value
                        }
                      };
                    })
                  }))
                }
                onCustomFieldRename={(itemId, oldKey, newKey) =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    items: current.items.map((item) => {
                      if (item.id !== itemId || !newKey.trim() || oldKey === newKey) {
                        return item;
                      }

                      const { [oldKey]: oldValue, ...rest } = item.fields;
                      return {
                        ...item,
                        fields: {
                          ...rest,
                          [newKey]: oldValue
                        }
                      };
                    })
                  }))
                }
                onCustomFieldAdd={(itemId) =>
                  updateSection(section.id, (current) => ({
                    ...current,
                    items: current.items.map((item) => {
                      if (item.id !== itemId) {
                        return item;
                      }

                      const nextKey = `campo_${Object.keys(item.fields).length + 1}`;
                      return {
                        ...item,
                        fields: {
                          ...item.fields,
                          [nextKey]: ""
                        }
                      };
                    })
                  }))
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
};

