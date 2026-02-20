import type { ResumeDto } from "@curriculo/shared";
import { baseThemeStyle, sectionGapClass } from "./template-utils";
import { SectionItems } from "./SectionItems";

export const ModernTemplate = ({ resume }: { resume: ResumeDto }) => {
  return (
    <article className="h-full bg-white" style={baseThemeStyle(resume.theme)}>
      <header
        className="px-7 py-6 text-white"
        style={{
          background: `linear-gradient(125deg, ${resume.theme.primaryColor}, ${resume.theme.secondaryColor})`
        }}
      >
        <h1 className="text-3xl font-bold leading-tight break-words">{resume.content.header.fullName}</h1>
        <p className="mt-1 text-lg break-words">{resume.content.header.role}</p>
        <p className="mt-3 text-xs opacity-90 break-words">
          {[
            resume.content.header.email,
            resume.content.header.phone,
            resume.content.header.location,
            resume.content.header.website,
            resume.content.header.linkedIn,
            resume.content.header.github
          ]
            .filter(Boolean)
            .join(" | ")}
        </p>
      </header>

      <div className={`p-5 ${sectionGapClass(resume.theme)}`}>
        {resume.content.sections.map((section) => (
          <section
            key={section.id}
            data-section-id={section.id}
            className="rounded-2xl border-l-4 bg-slate-50 p-3"
            style={{ borderColor: resume.theme.primaryColor }}
          >
            <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.12em]">{section.title}</h2>
            <SectionItems section={section} />
          </section>
        ))}
      </div>
    </article>
  );
};

