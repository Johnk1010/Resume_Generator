import type { ResumeDto, ResumeSection } from "@curriculo/shared";
import { escapeHtml, formatSectionItem } from "./utils.js";

const fontMap = {
  sourceSans: "'Source Sans 3', Arial, sans-serif",
  merriweather: "'Merriweather', Georgia, serif",
  montserrat: "'Montserrat', Helvetica, sans-serif"
} as const;

const spacingMap = {
  compact: {
    sectionGap: "10px",
    itemGap: "6px",
    padding: "20px"
  },
  comfortable: {
    sectionGap: "16px",
    itemGap: "12px",
    padding: "28px"
  }
} as const;

const sizeMap = {
  normal: "14px",
  large: "16px"
} as const;

const normalizeToken = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const sidebarTypeSet = new Set(["skills", "languages", "certifications"]);
const sidebarCustomTitleHints = ["contato", "contact", "dadospessoais", "informacoespessoais", "personal"];

const isSidebarSection = (section: ResumeSection): boolean => {
  if (sidebarTypeSet.has(section.type)) {
    return true;
  }

  if (section.type !== "custom") {
    return false;
  }

  const titleToken = normalizeToken(section.title);
  return sidebarCustomTitleHints.some((hint) => titleToken.includes(hint));
};

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

const buildSection = (section: ResumeSection): string => {
  const items = section.items
    .map(
      (item) => `<article class="section-item">${formatSectionItem(section, item)}</article>`
    )
    .join("");

  const sectionClass = section.pageBreakBefore ? "resume-section page-break-before" : "resume-section";

  return `
    <section class="${sectionClass}">
      <h2>${escapeHtml(section.title)}</h2>
      ${items}
    </section>
  `;
};

const sharedStyles = (resume: ResumeDto): string => {
  const spacing = spacingMap[resume.theme.spacing];
  const baseFontSize = sizeMap[resume.theme.fontSizeLevel];
  return `
    :root {
      --primary: ${resume.theme.primaryColor};
      --secondary: ${resume.theme.secondaryColor};
      --text: ${resume.theme.textColor};
      --font-family: ${fontMap[resume.theme.font]};
      --section-gap: ${spacing.sectionGap};
      --item-gap: ${spacing.itemGap};
      --padding: ${spacing.padding};
      --font-size: ${baseFontSize};
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: var(--font-family);
      color: var(--text);
      font-size: var(--font-size);
      line-height: 1.45;
      background: #f5f7fb;
    }

    .page {
      width: 794px;
      margin: 0 auto;
      background: #fff;
    }

    .resume-section { margin-bottom: var(--section-gap); }
    .resume-section.page-break-before {
      break-before: page;
      page-break-before: always;
    }
    .resume-section h2 {
      margin: 0 0 8px;
      color: var(--secondary);
      text-transform: uppercase;
      font-size: 0.9em;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e6ebf2;
      padding-bottom: 4px;
      break-after: avoid;
      page-break-after: avoid;
    }

    .section-item { margin-bottom: var(--item-gap); }
    .item-title { font-weight: 700; margin-bottom: 2px; }
    .item-meta { color: #4f5f72; margin-bottom: 4px; }
    .item-text { margin: 0; white-space: pre-wrap; }
    .item-link { color: var(--primary); text-decoration: none; }
    .page h1, .page h2, .page h3, .page p, .page span, .resume-section, .section-item, .item-title, .item-meta, .item-text, .item-link {
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    .tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .tag {
      padding: 2px 8px;
      border-radius: 999px;
      border: 1px solid color-mix(in srgb, var(--primary) 35%, #ffffff);
      background: color-mix(in srgb, var(--primary) 10%, #ffffff);
      font-size: 0.88em;
    }

    .contact-list {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      color: #ffffff;
      font-size: 0.92em;
    }

    .contact-list span { opacity: 0.95; }

    @page {
      size: A4;
      margin: 0;
    }

    @media print {
      html, body {
        width: 210mm;
      }

      body {
        background: #ffffff;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        width: 210mm;
        margin: 0;
      }

      .resume-section h2 {
        break-after: avoid-page;
        page-break-after: avoid;
      }

      .resume-section {
        break-inside: avoid-page;
        page-break-inside: avoid;
      }

      .section-item {
        break-inside: avoid-page;
        page-break-inside: avoid;
      }

      .modern-content {
        display: grid !important;
        grid-template-columns: 1fr !important;
      }

      .page.professional {
        display: grid !important;
        grid-template-columns: 30% 70% !important;
        align-items: start;
      }

      .exec-layout {
        display: grid !important;
        grid-template-columns: 34% 66% !important;
        align-items: start;
      }

      .creative-grid {
        display: grid !important;
        grid-template-columns: 1fr 1fr !important;
        align-items: start;
      }

      .modern-card,
      .creative-card {
        break-inside: auto;
        page-break-inside: auto;
      }

      .pro-aside,
      .pro-main,
      .exec-aside,
      .exec-main {
        border: none !important;
      }

      .creative-card.right {
        margin-top: 16px;
      }
    }
  `;
};

const renderHeaderContact = (resume: ResumeDto): string => {
  const contactValues = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ]
    .filter((value) => value?.trim().length)
    .map((value) => `<span>${escapeHtml(value)}</span>`)
    .join("");

  return `<div class="contact-list">${contactValues}</div>`;
};

const renderMinimal = (resume: ResumeDto): string => {
  const sections = resume.content.sections.map(buildSection).join("");

  return `
    <style>
      ${sharedStyles(resume)}

      .page.minimal {
        padding: var(--padding);
      }

      .minimal-header {
        border-bottom: 3px solid var(--primary);
        padding-bottom: 12px;
        margin-bottom: 18px;
      }

      .minimal-header h1 {
        margin: 0;
        font-size: 2em;
      }

      .minimal-header h3 {
        margin: 6px 0 10px;
        color: var(--secondary);
        font-weight: 600;
      }

      .minimal-header .contact-list {
        color: #2a3a4f;
      }
    </style>
    <main class="page minimal">
      <header class="minimal-header">
        <h1>${escapeHtml(resume.content.header.fullName)}</h1>
        <h3>${escapeHtml(resume.content.header.role)}</h3>
        ${renderHeaderContact(resume)}
      </header>
      ${sections}
    </main>
  `;
};

const renderModern = (resume: ResumeDto): string => {
  const sections = resume.content.sections
    .map(
      (section) => `<div class="modern-card">${buildSection(section)}</div>`
    )
    .join("");

  return `
    <style>
      ${sharedStyles(resume)}

      .page.modern {
        padding: 0;
      }

      .modern-hero {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        color: #fff;
        padding: 26px 28px;
      }

      .modern-hero h1 { margin: 0; font-size: 2.1em; }
      .modern-hero h3 { margin: 6px 0 12px; opacity: 0.95; }

      .modern-content {
        padding: 18px 22px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
      }

      .modern-card {
        border-left: 4px solid var(--primary);
        padding: 10px 12px;
        background: #f9fbff;
      }

      .modern-card h2 {
        border-bottom: none;
        margin-bottom: 6px;
      }
    </style>
    <main class="page modern">
      <header class="modern-hero">
        <h1>${escapeHtml(resume.content.header.fullName)}</h1>
        <h3>${escapeHtml(resume.content.header.role)}</h3>
        ${renderHeaderContact(resume)}
      </header>
      <section class="modern-content">${sections}</section>
    </main>
  `;
};

const renderProfessional = (resume: ResumeDto): string => {
  const sideSections = resume.content.sections.filter(isSidebarSection);
  const mainSections = resume.content.sections.filter((section) => !isSidebarSection(section));
  const contactMarkup = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ]
    .filter((value) => value?.trim().length)
    .map((value) => `<span>${escapeHtml(value)}</span>`)
    .join("");

  return `
    <style>
      ${sharedStyles(resume)}

      .page.professional {
        display: grid;
        grid-template-columns: 30% 70%;
      }

      .pro-aside {
        background: color-mix(in srgb, var(--secondary) 92%, #ffffff);
        color: #ffffff;
        padding: 24px 16px;
      }

      .pro-aside h1 {
        margin: 0;
        font-size: 1.55em;
      }

      .pro-aside h3 {
        margin: 4px 0 10px;
        font-size: 1em;
        font-weight: 500;
        opacity: 0.95;
      }

      .pro-aside .resume-section h2 {
        color: #ffffff;
        border-color: rgba(255, 255, 255, 0.28);
      }

      .pro-aside .item-meta { color: rgba(255, 255, 255, 0.85); }
      .pro-aside .tag {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.12);
      }

      .pro-main {
        padding: 24px 20px;
      }

      .pro-main .resume-section h2 {
        color: var(--primary);
      }

      .pro-contact {
        margin-bottom: 18px;
        display: grid;
        gap: 4px;
        font-size: 0.9em;
      }
    </style>
    <main class="page professional">
      <aside class="pro-aside">
        <h1>${escapeHtml(resume.content.header.fullName)}</h1>
        <h3>${escapeHtml(resume.content.header.role)}</h3>
        <div class="pro-contact">
          ${contactMarkup}
        </div>
        ${sideSections.map(buildSection).join("")}
      </aside>
      <section class="pro-main">
        ${mainSections.map(buildSection).join("")}
      </section>
    </main>
  `;
};

const renderExecutive = (resume: ResumeDto): string => {
  const sideSections = resume.content.sections.filter(isSidebarSection);
  const mainSections = resume.content.sections.filter((section) => !isSidebarSection(section));
  const hasSidebar = sideSections.length > 0;
  const contactMarkup = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ]
    .filter((value) => value?.trim().length)
    .map((value) => `<span>${escapeHtml(value)}</span>`)
    .join("");

  const contentMarkup = hasSidebar
    ? `
      <section class="exec-layout">
        <aside class="exec-aside">
          ${sideSections.map(buildSection).join("")}
        </aside>
        <section class="exec-main">
          ${mainSections.map(buildSection).join("")}
        </section>
      </section>
    `
    : `
      <section class="exec-main solo">
        ${mainSections.map(buildSection).join("")}
      </section>
    `;

  return `
    <style>
      ${sharedStyles(resume)}

      .page.executive {
        padding: 0;
      }

      .exec-header {
        padding: 22px 26px;
        border-bottom: 2px solid color-mix(in srgb, var(--primary) 35%, #ffffff);
      }

      .exec-head-grid {
        display: grid;
        grid-template-columns: 1.5fr 1fr;
        gap: 12px;
      }

      .exec-header h1 {
        margin: 0;
        font-size: 2.05em;
      }

      .exec-header h3 {
        margin: 6px 0 0;
        color: var(--secondary);
      }

      .exec-contact {
        display: grid;
        gap: 4px;
        font-size: 0.88em;
        text-align: right;
      }

      .exec-layout {
        display: grid;
        grid-template-columns: 34% 66%;
      }

      .exec-aside {
        padding: 18px 14px;
        border-right: 1px solid color-mix(in srgb, var(--primary) 28%, #ffffff);
      }

      .exec-aside .resume-section h2 {
        color: var(--secondary);
        border-color: color-mix(in srgb, var(--secondary) 35%, #ffffff);
      }

      .exec-main {
        padding: 18px 20px;
      }

      .exec-main.solo {
        padding: 20px 24px;
      }

      .exec-main .resume-section h2 {
        color: var(--primary);
      }
    </style>
    <main class="page executive">
      <header class="exec-header">
        <div class="exec-head-grid">
          <div>
            <h1>${escapeHtml(resume.content.header.fullName)}</h1>
            <h3>${escapeHtml(resume.content.header.role)}</h3>
          </div>
          <div class="exec-contact">${contactMarkup}</div>
        </div>
      </header>
      ${contentMarkup}
    </main>
  `;
};

const renderCreative = (resume: ResumeDto): string => {
  const rows = buildCreativeRows(resume.content.sections);
  const contactMarkup = [
    resume.content.header.email,
    resume.content.header.phone,
    resume.content.header.location,
    resume.content.header.website,
    resume.content.header.linkedIn,
    resume.content.header.github
  ]
    .filter((value) => value?.trim().length)
    .map((value) => `<span class="creative-chip">${escapeHtml(value)}</span>`)
    .join("");

  const rowMarkup = rows
    .map((row) => {
      const leftCell = row.left ? `<div class="creative-card">${buildSection(row.left)}</div>` : "<div class=\"creative-empty\"></div>";
      const rightCell = row.right
        ? `<div class="creative-card right">${buildSection(row.right)}</div>`
        : "<div class=\"creative-empty\"></div>";

      return `${leftCell}${rightCell}`;
    })
    .join("");

  return `
    <style>
      ${sharedStyles(resume)}

      .page.creative {
        padding: 0;
      }

      .creative-hero {
        position: relative;
        overflow: hidden;
        background: linear-gradient(125deg, var(--secondary), var(--primary));
        color: #ffffff;
        padding: 24px 24px 20px;
      }

      .creative-orb {
        position: absolute;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
      }

      .creative-orb.orb-1 {
        width: 140px;
        height: 140px;
        top: -40px;
        right: -36px;
      }

      .creative-orb.orb-2 {
        width: 100px;
        height: 100px;
        bottom: -34px;
        left: -26px;
        background: rgba(255, 255, 255, 0.15);
      }

      .creative-hero h1 {
        margin: 0;
        font-size: 2em;
        position: relative;
      }

      .creative-hero h3 {
        margin: 6px 0 0;
        font-weight: 500;
        position: relative;
      }

      .creative-contact {
        margin-top: 12px;
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        position: relative;
      }

      .creative-chip {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        font-size: 0.82em;
      }

      .creative-grid {
        padding: 14px;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .creative-col {
        display: contents;
      }

      .creative-card {
        border: 1px solid color-mix(in srgb, var(--primary) 30%, #ffffff);
        border-radius: 14px;
        background: #f8fbff;
        padding: 10px 12px;
      }

      .creative-card.right {
        margin-top: 16px;
      }

      .creative-empty {
        min-height: 1px;
      }

      .creative-card .resume-section:last-child {
        margin-bottom: 0;
      }

      .creative-card .resume-section h2 {
        color: var(--secondary);
        border-bottom: none;
        margin-bottom: 6px;
      }
    </style>
    <main class="page creative">
      <header class="creative-hero">
        <span class="creative-orb orb-1"></span>
        <span class="creative-orb orb-2"></span>
        <h1>${escapeHtml(resume.content.header.fullName)}</h1>
        <h3>${escapeHtml(resume.content.header.role)}</h3>
        <div class="creative-contact">${contactMarkup}</div>
      </header>
      <section class="creative-grid">
        ${rowMarkup}
      </section>
    </main>
  `;
};

export const renderResumeHtml = (resume: ResumeDto): string => {
  const body =
    resume.templateId === "minimal"
      ? renderMinimal(resume)
      : resume.templateId === "modern"
        ? renderModern(resume)
        : resume.templateId === "professional"
          ? renderProfessional(resume)
          : resume.templateId === "executive"
            ? renderExecutive(resume)
            : renderCreative(resume);

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&display=swap"
        />
        <title>${escapeHtml(resume.title)}</title>
      </head>
      <body>
        ${body}
      </body>
    </html>
  `;
};

