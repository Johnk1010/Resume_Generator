import type { ResumeSection, SectionType, TemplateId, SectionItem } from "@curriculo/shared";
import { normalizeSectionTitle } from "@curriculo/shared";

export const templateOptions: Array<{ id: TemplateId; label: string; description: string }> = [
  {
    id: "minimal",
    label: "Minimalista",
    description: "Uma coluna limpa e foco em conteudo."
  },
  {
    id: "modern",
    label: "Moderno",
    description: "Cabecalho forte e blocos destacados."
  },
  {
    id: "professional",
    label: "Profissional",
    description: "Duas colunas com informacoes laterais."
  },
  {
    id: "executive",
    label: "Executivo",
    description: "Visual corporativo com leitura objetiva."
  },
  {
    id: "creative",
    label: "Criativo",
    description: "Layout com destaque visual e blocos em estilo portfolio."
  }
];

export const sectionTypeOptions: Array<{ type: SectionType; label: string }> = [
  { type: "summary", label: "Resumo" },
  { type: "experience", label: "Experiencia" },
  { type: "education", label: "Educacao" },
  { type: "skills", label: "Habilidades" },
  { type: "projects", label: "Projetos" },
  { type: "certifications", label: "Certificacoes" },
  { type: "languages", label: "Idiomas" },
  { type: "custom", label: "Personalizada" }
];

export interface FieldConfig {
  key: string;
  label: string;
  multiline?: boolean;
}

const defaultFieldConfigMap: Record<SectionType, FieldConfig[]> = {
  summary: [{ key: "text", label: "Texto", multiline: true }],
  experience: [
    { key: "role", label: "Cargo" },
    { key: "company", label: "Empresa" },
    { key: "startDate", label: "Inicio" },
    { key: "endDate", label: "Fim" },
    { key: "location", label: "Local" },
    { key: "description", label: "Descricao", multiline: true }
  ],
  education: [
    { key: "degree", label: "Curso/Titulo" },
    { key: "institution", label: "Instituicao" },
    { key: "startDate", label: "Inicio" },
    { key: "endDate", label: "Fim" },
    { key: "description", label: "Descricao", multiline: true }
  ],
  skills: [{ key: "name", label: "Skills (separadas por virgula)", multiline: true }],
  projects: [
    { key: "name", label: "Projeto" },
    { key: "link", label: "Link" },
    { key: "description", label: "Descricao", multiline: true }
  ],
  certifications: [
    { key: "name", label: "Certificacao" },
    { key: "issuer", label: "Emissor" },
    { key: "year", label: "Ano" }
  ],
  languages: [
    { key: "language", label: "Idioma" },
    { key: "level", label: "Nivel" }
  ],
  custom: [{ key: "titulo", label: "Campo", multiline: false }]
};

export const getSectionFieldConfigs = (type: SectionType): FieldConfig[] => defaultFieldConfigMap[type];

const createItem = (fields: Record<string, string>): SectionItem => ({
  id: crypto.randomUUID(),
  fields
});

export const createEmptyItem = (type: SectionType): SectionItem => {
  const fields = getSectionFieldConfigs(type).reduce<Record<string, string>>((acc, field) => {
    acc[field.key] = "";
    return acc;
  }, {});

  return createItem(fields);
};

export const createSection = (type: SectionType): ResumeSection => ({
  id: crypto.randomUUID(),
  type,
  title: normalizeSectionTitle(type),
  items: [createEmptyItem(type)],
  pageBreakBefore: false,
  layoutColumn: "auto"
});

export const reorderSections = (
  sections: ResumeSection[],
  sourceId: string,
  targetId: string
): ResumeSection[] => {
  const sourceIndex = sections.findIndex((section) => section.id === sourceId);
  const targetIndex = sections.findIndex((section) => section.id === targetId);

  if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
    return sections;
  }

  const next = [...sections];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);

  return next;
};
