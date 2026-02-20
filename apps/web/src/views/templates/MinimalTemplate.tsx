import type { ResumeDto } from "@curriculo/shared";
import { baseThemeStyle, sectionGapClass } from "./template-utils";
import { SectionItems } from "./SectionItems";

export const MinimalTemplate = ({ resume }: { resume: ResumeDto }) => {
  return (
    <article className="h-full bg-white p-7" style={baseThemeStyle(resume.theme)}>
      <header className="border-b-4 pb-4" style={{ borderColor: resume.theme.primaryColor }}>
        <h1 className="text-3xl font-bold leading-tight break-words">{resume.content.header.fullName}</h1>
        <p className="mt-1 text-lg font-semibold break-words" style={{ color: resume.theme.secondaryColor }}>
          {resume.content.header.role}
        </p>
        <p className="mt-2 text-xs text-black/70 break-words">
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

      <div className={`mt-4 ${sectionGapClass(resume.theme)}`}>
        {resume.content.sections.map((section) => (
          <section key={section.id} data-section-id={section.id}>
            <h2
              className="mb-2 text-sm font-bold uppercase tracking-[0.15em]"
              style={{ color: resume.theme.secondaryColor }}
            >
              {section.title}
            </h2>
            <SectionItems section={section} />
          </section>
        ))}
      </div>
    </article>
  );
};

