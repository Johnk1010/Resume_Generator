import type { ResumeSection, SectionItem } from "@curriculo/shared";

const sidebarTypeSet = new Set(["skills", "languages", "certifications"]);
const sidebarCustomTitleHints = ["contato", "contact", "dadospessoais", "informacoespessoais", "personal"];

const normalizeToken = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const itemField = (item: SectionItem, key: string): string => item.fields[key]?.trim() ?? "";
const joinNonEmpty = (values: string[], separator: string): string => values.filter(Boolean).join(separator);
const splitSkills = (value: string): string[] =>
  value
    .split(/[,;\n]/g)
    .map((token) => token.trim())
    .filter(Boolean);

export const isSidebarSection = (section: ResumeSection): boolean => {
  if (sidebarTypeSet.has(section.type)) {
    return true;
  }

  if (section.type !== "custom") {
    return false;
  }

  const titleToken = normalizeToken(section.title);
  return sidebarCustomTitleHints.some((hint) => titleToken.includes(hint));
};

const renderExperience = (item: SectionItem): JSX.Element => {
  const title = joinNonEmpty([itemField(item, "role"), itemField(item, "company")], " - ");
  const period = joinNonEmpty([itemField(item, "startDate"), itemField(item, "endDate")], " - ");
  const meta = joinNonEmpty([period, itemField(item, "location")], " | ");
  const description = itemField(item, "description");

  return (
    <>
      {title && <p className="font-semibold break-words">{title}</p>}
      {meta && <p className="text-[0.92em] opacity-80 break-words">{meta}</p>}
      {description && <p className="mt-1 whitespace-pre-line break-words">{description}</p>}
    </>
  );
};

const renderEducation = (item: SectionItem): JSX.Element => {
  const degree = itemField(item, "degree");
  const period = joinNonEmpty([itemField(item, "startDate"), itemField(item, "endDate")], " - ");
  const meta = joinNonEmpty([itemField(item, "institution"), period], " | ");
  const description = itemField(item, "description");

  return (
    <>
      {degree && <p className="font-semibold break-words">{degree}</p>}
      {meta && <p className="text-[0.92em] opacity-80 break-words">{meta}</p>}
      {description && <p className="mt-1 whitespace-pre-line break-words">{description}</p>}
    </>
  );
};

const renderProject = (item: SectionItem): JSX.Element => {
  const name = itemField(item, "name");
  const link = itemField(item, "link");
  const description = itemField(item, "description");

  return (
    <>
      {name && <p className="font-semibold break-words">{name}</p>}
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="text-[0.92em] underline break-all"
        >
          {link}
        </a>
      )}
      {description && <p className="mt-1 whitespace-pre-line break-words">{description}</p>}
    </>
  );
};

const renderCertification = (item: SectionItem): JSX.Element => {
  const name = itemField(item, "name");
  const meta = joinNonEmpty([itemField(item, "issuer"), itemField(item, "year")], " - ");

  return (
    <>
      {name && <p className="font-semibold break-words">{name}</p>}
      {meta && <p className="text-[0.92em] opacity-80 break-words">{meta}</p>}
    </>
  );
};

const renderCustom = (item: SectionItem): JSX.Element => {
  const rows = Object.entries(item.fields).filter(([, value]) => value.trim().length > 0);

  if (rows.length === 0) {
    return <p className="break-words">Sem conteudo.</p>;
  }

  return (
    <>
      {rows.map(([key, value]) => (
        <p className="whitespace-pre-line break-words" key={key}>
          <span className="font-semibold">{key}: </span>
          {value}
        </p>
      ))}
    </>
  );
};

export const SectionItems = ({ section, sidebar = false }: { section: ResumeSection; sidebar?: boolean }) => {
  return (
    <div className={sidebar ? "space-y-1.5" : "space-y-2"}>
      {section.items.map((item) => {
        if (section.type === "summary") {
          return (
            <article key={item.id}>
              <p className="whitespace-pre-line break-words">{itemField(item, "text")}</p>
            </article>
          );
        }

        if (section.type === "experience") {
          return (
            <article key={item.id}>
              {renderExperience(item)}
            </article>
          );
        }

        if (section.type === "education") {
          return (
            <article key={item.id}>
              {renderEducation(item)}
            </article>
          );
        }

        if (section.type === "skills") {
          const raw = itemField(item, "name");
          const skills = splitSkills(raw);

          return (
            <article key={item.id}>
              {sidebar || skills.length <= 1 ? (
                <p className="break-words">{raw}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => (
                    <span className="rounded-full border border-black/15 bg-black/[0.04] px-2 py-0.5 text-[0.88em]" key={skill}>
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </article>
          );
        }

        if (section.type === "projects") {
          return (
            <article key={item.id}>
              {renderProject(item)}
            </article>
          );
        }

        if (section.type === "certifications") {
          return (
            <article key={item.id}>
              {renderCertification(item)}
            </article>
          );
        }

        if (section.type === "languages") {
          const label = joinNonEmpty([itemField(item, "language"), itemField(item, "level")], ": ");
          return (
            <article key={item.id}>
              <p className="break-words">{label}</p>
            </article>
          );
        }

        return (
          <article key={item.id}>
            {renderCustom(item)}
          </article>
        );
      })}
    </div>
  );
};
