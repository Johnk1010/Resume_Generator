import type { ResumeSection, SectionItem } from "@curriculo/shared";

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
};

export const escapeHtml = (value: string): string => {
  return value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
};

export const sanitizeFilename = (value: string): string => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_|_$/g, "") || "Curriculo";
};

export const itemField = (item: SectionItem, key: string): string => {
  return item.fields[key]?.trim() ?? "";
};

const joinNonEmpty = (values: string[], separator: string): string => values.filter(Boolean).join(separator);

export const formatSectionItem = (section: ResumeSection, item: SectionItem): string => {
  const safe = (value: string) => escapeHtml(value);

  switch (section.type) {
    case "summary": {
      return `<p class="item-text">${safe(itemField(item, "text"))}</p>`;
    }
    case "experience": {
      const title = joinNonEmpty([itemField(item, "role"), itemField(item, "company")], " - ");
      const period = joinNonEmpty([itemField(item, "startDate"), itemField(item, "endDate")], " - ");
      const meta = joinNonEmpty([period, itemField(item, "location")], " | ");
      return `
        <div class="item-title">${safe(title)}</div>
        <div class="item-meta">${safe(meta)}</div>
        <p class="item-text">${safe(itemField(item, "description"))}</p>
      `;
    }
    case "education": {
      const period = joinNonEmpty([itemField(item, "startDate"), itemField(item, "endDate")], " - ");
      const meta = joinNonEmpty([itemField(item, "institution"), period], " | ");
      return `
        <div class="item-title">${safe(itemField(item, "degree"))}</div>
        <div class="item-meta">${safe(meta)}</div>
        <p class="item-text">${safe(itemField(item, "description"))}</p>
      `;
    }
    case "skills": {
      const skills = itemField(item, "name")
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean)
        .map((skill) => `<span class="tag">${safe(skill)}</span>`)
        .join("");
      return `<div class="tag-list">${skills}</div>`;
    }
    case "projects": {
      const link = itemField(item, "link");
      const linkMarkup = link
        ? `<a class="item-link" href="${safe(link)}" target="_blank" rel="noreferrer">${safe(link)}</a>`
        : "";
      return `
        <div class="item-title">${safe(itemField(item, "name"))}</div>
        ${linkMarkup}
        <p class="item-text">${safe(itemField(item, "description"))}</p>
      `;
    }
    case "certifications": {
      const meta = joinNonEmpty([itemField(item, "issuer"), itemField(item, "year")], " - ");
      return `
        <div class="item-title">${safe(itemField(item, "name"))}</div>
        <div class="item-meta">${safe(meta)}</div>
      `;
    }
    case "languages": {
      const label = joinNonEmpty([itemField(item, "language"), itemField(item, "level")], ": ");
      return `<div class="item-title">${safe(label)}</div>`;
    }
    case "custom": {
      const rows = Object.entries(item.fields)
        .filter(([, value]) => value.trim().length)
        .map(([key, value]) => `<div class="item-text"><strong>${safe(key)}:</strong> ${safe(value)}</div>`)
        .join("");
      return rows || "<p class=\"item-text\">Sem conteúdo.</p>";
    }
    default:
      return "";
  }
};

