import type { ResumeDto, ResumeSection } from "@curriculo/shared";
import { SectionItems } from "./SectionItems";
import { baseThemeStyle } from "./template-utils";

interface CreativeRow {
  left: ResumeSection | null;
  right: ResumeSection | null;
}

const getSectionColumn = (section: ResumeSection): "auto" | "left" | "right" => {
  if (section.layoutColumn === "left" || section.layoutColumn === "right") {
    return section.layoutColumn;
  }

  return "auto";
};

const buildCreativeRows = (sections: ResumeSection[]): CreativeRow[] => {
  const rows: CreativeRow[] = [];
  let autoNext: "left" | "right" = "left";

  const createRow = (): CreativeRow => {
    const row: CreativeRow = { left: null, right: null };
    rows.push(row);
    return row;
  };

  const lastRow = (): CreativeRow | null => rows[rows.length - 1] ?? null;

  for (const section of sections) {
    const preferredColumn = getSectionColumn(section);

    if (preferredColumn === "auto") {
      let row = lastRow();
      if (!row || (autoNext === "left" ? row.left !== null : row.right !== null)) {
        row = createRow();
      }

      if (autoNext === "left") {
        row.left = section;
        autoNext = row.right === null ? "right" : "left";
      } else {
        row.right = section;
        autoNext = "left";
      }

      continue;
    }

    let row = lastRow();
    const targetFilled = preferredColumn === "left" ? row?.left !== null : row?.right !== null;
    if (!row || targetFilled) {
      row = createRow();
    }

    if (preferredColumn === "left") {
      row.left = section;
    } else {
      row.right = section;
    }
  }

  return rows.length > 0 ? rows : [{ left: null, right: null }];
};

export const CreativeTemplate = ({ resume }: { resume: ResumeDto }) => {
  const rows = buildCreativeRows(resume.content.sections);
  const contactValues = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ].filter(Boolean);

  const renderCard = (section: ResumeSection | null, align: "left" | "right") => {
    if (!section) {
      return <div className="min-h-[1px]" />;
    }

    return (
      <section
        key={section.id}
        data-section-id={section.id}
        className={`rounded-2xl border bg-slate-50 p-3 ${align === "right" ? "mt-4" : ""}`}
        style={{ borderColor: `${resume.theme.primaryColor}40` }}
      >
        <h2
          className="mb-2 text-xs font-bold uppercase tracking-[0.12em]"
          style={{ color: resume.theme.secondaryColor }}
        >
          {section.title}
        </h2>
        <div className="text-sm">
          <SectionItems section={section} />
        </div>
      </section>
    );
  };

  return (
    <article className="h-full bg-white" style={baseThemeStyle(resume.theme)}>
      <header
        className="relative overflow-hidden px-6 py-6 text-white"
        style={{
          background: `linear-gradient(125deg, ${resume.theme.secondaryColor}, ${resume.theme.primaryColor})`
        }}
      >
        <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-24 w-24 rounded-full bg-white/15" />
        <h1 className="relative text-3xl font-bold break-words">{resume.content.header.fullName}</h1>
        <p className="relative mt-1 text-lg break-words">{resume.content.header.role}</p>
        <div className="relative mt-3 flex flex-wrap gap-1.5 text-[11px]">
          {contactValues.map((value) => (
            <span key={value} className="rounded-full bg-white/20 px-2 py-0.5 break-all">
              {value}
            </span>
          ))}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 p-4">
        {rows.map((row, index) => (
          <div className="contents" key={`creative-row-${index}`}>
            {renderCard(row.left, "left")}
            {renderCard(row.right, "right")}
          </div>
        ))}
      </div>
    </article>
  );
};
