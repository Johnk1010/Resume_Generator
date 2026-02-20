import type { ResumeDto } from "@curriculo/shared";
import { isSidebarSection, SectionItems } from "./SectionItems";
import { baseThemeStyle, sectionGapClass } from "./template-utils";

export const ExecutiveTemplate = ({ resume }: { resume: ResumeDto }) => {
  const sideSections = resume.content.sections.filter(isSidebarSection);
  const mainSections = resume.content.sections.filter((section) => !isSidebarSection(section));
  const hasSidebar = sideSections.length > 0;
  const contactValues = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ].filter(Boolean);

  return (
    <article className="h-full bg-white" style={baseThemeStyle(resume.theme)}>
      <header
        className="border-b px-6 py-5"
        style={{ borderColor: `${resume.theme.primaryColor}50` }}
      >
        <div className="grid gap-3 sm:grid-cols-[1.5fr_1fr]">
          <div>
            <h1 className="text-3xl font-bold break-words">{resume.content.header.fullName}</h1>
            <p className="mt-1 text-base font-semibold break-words" style={{ color: resume.theme.secondaryColor }}>
              {resume.content.header.role}
            </p>
          </div>

          <div className="space-y-1 text-xs break-words sm:text-right">
            {contactValues.map((value) => (
              <p key={value}>{value}</p>
            ))}
          </div>
        </div>
      </header>

      {hasSidebar ? (
        <div className="grid grid-cols-[34%_66%] gap-4 p-5">
          <aside
            className={`border-r pr-4 ${sectionGapClass(resume.theme)}`}
            style={{ borderColor: `${resume.theme.primaryColor}35` }}
          >
            {sideSections.map((section) => (
              <section key={section.id} data-section-id={section.id}>
                <h2
                  className="mb-2 border-b pb-1 text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ borderColor: `${resume.theme.secondaryColor}40`, color: resume.theme.secondaryColor }}
                >
                  {section.title}
                </h2>
                <div className="text-xs">
                  <SectionItems section={section} sidebar />
                </div>
              </section>
            ))}
          </aside>

          <main className={sectionGapClass(resume.theme)}>
            {mainSections.map((section) => (
              <section key={section.id} data-section-id={section.id}>
                <h2
                  className="mb-2 border-b pb-1 text-xs font-bold uppercase tracking-[0.14em]"
                  style={{ borderColor: `${resume.theme.primaryColor}35`, color: resume.theme.primaryColor }}
                >
                  {section.title}
                </h2>
                <div className="text-sm">
                  <SectionItems section={section} />
                </div>
              </section>
            ))}
          </main>
        </div>
      ) : (
        <main className={`p-5 ${sectionGapClass(resume.theme)}`}>
          {mainSections.map((section) => (
            <section key={section.id} data-section-id={section.id}>
              <h2
                className="mb-2 border-b pb-1 text-xs font-bold uppercase tracking-[0.14em]"
                style={{ borderColor: `${resume.theme.primaryColor}35`, color: resume.theme.primaryColor }}
              >
                {section.title}
              </h2>
              <div className="text-sm">
                <SectionItems section={section} />
              </div>
            </section>
          ))}
        </main>
      )}
    </article>
  );
};
