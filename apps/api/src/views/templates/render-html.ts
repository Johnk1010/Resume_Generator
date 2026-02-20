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

const buildSection = (section: ResumeSection): string => {
  const items = section.items
    .map(
      (item) => `<article class="section-item">${formatSectionItem(section, item)}</article>`
    )
    .join("");

  return `
    <section class="resume-section">
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
      min-height: 1123px;
      margin: 0 auto;
      background: #fff;
    }

    .resume-section { margin-bottom: var(--section-gap); }
    .resume-section h2 {
      margin: 0 0 8px;
      color: var(--secondary);
      text-transform: uppercase;
      font-size: 0.9em;
      letter-spacing: 0.06em;
      border-bottom: 1px solid #e6ebf2;
      padding-bottom: 4px;
    }

    .section-item { margin-bottom: var(--item-gap); }
    .item-title { font-weight: 700; margin-bottom: 2px; }
    .item-meta { color: #4f5f72; margin-bottom: 4px; }
    .item-text { margin: 0; white-space: pre-wrap; }
    .item-link { color: var(--primary); text-decoration: none; }
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
  const sidebarTypes = new Set(["skills", "languages", "certifications"]);
  const sideSections = resume.content.sections.filter((section) => sidebarTypes.has(section.type));
  const mainSections = resume.content.sections.filter((section) => !sidebarTypes.has(section.type));

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
          <span>${escapeHtml(resume.content.header.email)}</span>
          <span>${escapeHtml(resume.content.header.phone)}</span>
          <span>${escapeHtml(resume.content.header.location)}</span>
          <span>${escapeHtml(resume.content.header.linkedIn)}</span>
          <span>${escapeHtml(resume.content.header.github)}</span>
        </div>
        ${sideSections.map(buildSection).join("")}
      </aside>
      <section class="pro-main">
        ${mainSections.map(buildSection).join("")}
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
        : renderProfessional(resume);

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

