import type { TemplateId } from "@curriculo/shared";
import clsx from "clsx";
import { templateOptions } from "../../models/utils/resume-editor";

interface TemplateSelectorProps {
  value: TemplateId;
  onChange: (templateId: TemplateId) => void;
}

export const TemplateSelector = ({ value, onChange }: TemplateSelectorProps) => {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {templateOptions.map((template) => (
        <button
          type="button"
          key={template.id}
          onClick={() => onChange(template.id)}
          className={clsx(
            "rounded-2xl border p-4 text-left transition",
            value === template.id
              ? "border-teal bg-teal/10 shadow-glow"
              : "border-black/10 bg-white hover:border-teal/40"
          )}
        >
          <p className="font-heading text-lg font-bold text-ink">{template.label}</p>
          <p className="mt-1 text-sm text-ink/70">{template.description}</p>
        </button>
      ))}
    </div>
  );
};

