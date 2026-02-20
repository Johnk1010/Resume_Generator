import type { ResumeDto } from "@curriculo/shared";
import { baseThemeStyle, sectionGapClass } from "./template-utils";
import { isSidebarSection, SectionItems } from "./SectionItems";

export const ProfessionalTemplate = ({ resume }: { resume: ResumeDto }) => {
  const sideSections = resume.content.sections.filter(isSidebarSection);
  const mainSections = resume.content.sections.filter((section) => !isSidebarSection(section));

  return (
    <article className="grid h-full grid-cols-[32%_68%] bg-white" style={baseThemeStyle(resume.theme)}>
      <aside className="p-4 text-white" style={{ backgroundColor: resume.theme.secondaryColor }}>
        <h1 className="text-2xl font-bold leading-tight break-words">{resume.content.header.fullName}</h1>
        <p className="mt-1 text-base break-words">{resume.content.header.role}</p>
        <div className="mt-3 space-y-1 text-xs break-words">
          {[
            resume.content.header.email,
            resume.content.header.phone,
            resume.content.header.location,
            resume.content.header.website,
            resume.content.header.linkedIn,
            resume.content.header.github
          ]
            .filter(Boolean)
            .map((value) => (
              <p key={value}>{value}</p>
            ))}
        </div>

        <div className={`mt-5 ${sectionGapClass(resume.theme)}`}>
          {sideSections.map((section) => (
            <section key={section.id} data-section-id={section.id}>
              <h2 className="mb-1 border-b border-white/40 pb-1 text-xs font-bold uppercase tracking-[0.15em]">
                {section.title}
              </h2>
              <div className="text-xs">
                <SectionItems section={section} sidebar />
              </div>
            </section>
          ))}
        </div>
      </aside>

      <section className={`p-4 ${sectionGapClass(resume.theme)}`}>
        {mainSections.map((section) => (
          <section key={section.id} data-section-id={section.id}>
            <h2
              className="mb-1 border-b pb-1 text-xs font-bold uppercase tracking-[0.15em]"
              style={{ borderColor: `${resume.theme.primaryColor}40`, color: resume.theme.primaryColor }}
            >
              {section.title}
            </h2>
            <div className="text-sm">
              <SectionItems section={section} />
            </div>
          </section>
        ))}
      </section>
    </article>
  );
};

