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

export const formatSectionItem = (section: ResumeSection, item: SectionItem): string => {
  const safe = (value: string) => escapeHtml(value);

  switch (section.type) {
    case "summary": {
      return `<p class="item-text">${safe(itemField(item, "text"))}</p>`;
    }
    case "experience": {
      return `
        <div class="item-title">${safe(itemField(item, "role"))} - ${safe(itemField(item, "company"))}</div>
        <div class="item-meta">${safe(itemField(item, "startDate"))} - ${safe(itemField(item, "endDate"))} | ${safe(itemField(item, "location"))}</div>
        <p class="item-text">${safe(itemField(item, "description"))}</p>
      `;
    }
    case "education": {
      return `
        <div class="item-title">${safe(itemField(item, "degree"))}</div>
        <div class="item-meta">${safe(itemField(item, "institution"))} | ${safe(itemField(item, "startDate"))} - ${safe(itemField(item, "endDate"))}</div>
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
      return `
        <div class="item-title">${safe(itemField(item, "name"))}</div>
        <div class="item-meta">${safe(itemField(item, "issuer"))} ${safe(itemField(item, "year"))}</div>
      `;
    }
    case "languages": {
      return `<div class="item-title">${safe(itemField(item, "language"))}: ${safe(itemField(item, "level"))}</div>`;
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

