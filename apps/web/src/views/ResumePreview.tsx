import type { ResumeDto } from "@curriculo/shared";
import { MinimalTemplate } from "./templates/MinimalTemplate";
import { ModernTemplate } from "./templates/ModernTemplate";
import { ProfessionalTemplate } from "./templates/ProfessionalTemplate";

export const ResumePreview = ({ resume }: { resume: ResumeDto }) => {
  return (
    <div className="rounded-3xl border border-black/10 bg-slate-200 p-3 shadow-lg">
      <div className="mx-auto aspect-[210/297] w-full max-w-[720px] overflow-hidden rounded-xl bg-white">
        {resume.templateId === "minimal" && <MinimalTemplate resume={resume} />}
        {resume.templateId === "modern" && <ModernTemplate resume={resume} />}
        {resume.templateId === "professional" && <ProfessionalTemplate resume={resume} />}
      </div>
    </div>
  );
};

