import { z } from "zod";

export const templateIds = ["minimal", "modern", "professional"] as const;
export type TemplateId = (typeof templateIds)[number];

export const sectionTypes = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "languages",
  "custom"
] as const;

export type SectionType = (typeof sectionTypes)[number];

export const fontOptions = ["sourceSans", "merriweather", "montserrat"] as const;
export type FontOption = (typeof fontOptions)[number];

export const spacingOptions = ["compact", "comfortable"] as const;
export type SpacingOption = (typeof spacingOptions)[number];

export interface HeaderContent {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedIn: string;
  github: string;
}

export interface SectionItem {
  id: string;
  fields: Record<string, string>;
}

export interface ResumeSection {
  id: string;
  type: SectionType;
  title: string;
  items: SectionItem[];
}

export interface ResumeContent {
  header: HeaderContent;
  sections: ResumeSection[];
}

export interface ResumeTheme {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  font: FontOption;
  spacing: SpacingOption;
  fontSizeLevel: "normal" | "large";
}

export interface ResumeVersionSnapshot {
  title: string;
  templateId: TemplateId;
  content: ResumeContent;
  theme: ResumeTheme;
}

export interface UserDto {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeDto {
  id: string;
  userId: string;
  title: string;
  templateId: TemplateId;
  content: ResumeContent;
  theme: ResumeTheme;
  createdAt: string;
  updatedAt: string;
}

export interface ResumeVersionDto {
  id: string;
  resumeId: string;
  name: string;
  snapshot: ResumeVersionSnapshot;
  createdAt: string;
}

export interface TokensDto {
  accessToken: string;
  refreshToken: string;
}

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  newPassword: z.string().min(6)
});

export const headerContentSchema = z.object({
  fullName: z.string().default(""),
  role: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  website: z.string().default(""),
  linkedIn: z.string().default(""),
  github: z.string().default("")
});

export const sectionItemSchema = z.object({
  id: z.string(),
  fields: z.record(z.string())
});

export const resumeSectionSchema = z.object({
  id: z.string(),
  type: z.enum(sectionTypes),
  title: z.string().min(1),
  items: z.array(sectionItemSchema)
});

export const resumeContentSchema = z.object({
  header: headerContentSchema,
  sections: z.array(resumeSectionSchema)
});

export const resumeThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  textColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  font: z.enum(fontOptions),
  spacing: z.enum(spacingOptions),
  fontSizeLevel: z.enum(["normal", "large"])
});

export const createResumeSchema = z.object({
  title: z.string().min(2),
  templateId: z.enum(templateIds)
});

export const updateResumeSchema = z.object({
  title: z.string().min(2).optional(),
  templateId: z.enum(templateIds).optional(),
  content: resumeContentSchema.optional(),
  theme: resumeThemeSchema.optional()
});

export const createVersionSchema = z.object({
  name: z.string().min(2)
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateResumeInput = z.infer<typeof createResumeSchema>;
export type UpdateResumeInput = z.infer<typeof updateResumeSchema>;
export type CreateVersionInput = z.infer<typeof createVersionSchema>;

export const defaultTheme: ResumeTheme = {
  primaryColor: "#0A66C2",
  secondaryColor: "#1A3A5F",
  textColor: "#1C1E21",
  font: "sourceSans",
  spacing: "comfortable",
  fontSizeLevel: "normal"
};

const makeItem = (fields: Record<string, string>): SectionItem => ({
  id: crypto.randomUUID(),
  fields
});

export const buildDefaultResumeContent = (): ResumeContent => ({
  header: {
    fullName: "Nome Completo",
    role: "Cargo desejado",
    email: "email@exemplo.com",
    phone: "(11) 99999-9999",
    location: "Cidade, Estado",
    website: "",
    linkedIn: "linkedin.com/in/seuperfil",
    github: "github.com/seuusuario"
  },
  sections: [
    {
      id: crypto.randomUUID(),
      type: "summary",
      title: "Resumo",
      items: [
        makeItem({
          text: "Profissional com foco em resultados, colaboração e melhoria contínua."
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "experience",
      title: "Experiência",
      items: [
        makeItem({
          role: "Desenvolvedor Full Stack",
          company: "Empresa Exemplo",
          startDate: "2022-01",
          endDate: "Atual",
          location: "Remoto",
          description: "Atuação em APIs, frontend React e automações internas."
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "education",
      title: "Educação",
      items: [
        makeItem({
          degree: "Bacharelado em Ciência da Computação",
          institution: "Universidade Exemplo",
          startDate: "2018",
          endDate: "2021",
          description: "Foco em engenharia de software e estruturas de dados."
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "skills",
      title: "Habilidades",
      items: [
        makeItem({
          name: "TypeScript, React, Node.js, PostgreSQL"
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "projects",
      title: "Projetos",
      items: [
        makeItem({
          name: "Gerador de Currículos",
          link: "https://github.com/exemplo",
          description: "Aplicação web com exportação em PDF/DOCX."
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "certifications",
      title: "Certificações",
      items: [
        makeItem({
          name: "AWS Cloud Practitioner",
          issuer: "Amazon",
          year: "2024"
        })
      ]
    },
    {
      id: crypto.randomUUID(),
      type: "languages",
      title: "Idiomas",
      items: [
        makeItem({
          language: "Português",
          level: "Nativo"
        }),
        makeItem({
          language: "Inglês",
          level: "Avançado"
        })
      ]
    }
  ]
});

export const normalizeSectionTitle = (type: SectionType): string => {
  switch (type) {
    case "summary":
      return "Resumo";
    case "experience":
      return "Experiência";
    case "education":
      return "Educação";
    case "skills":
      return "Habilidades";
    case "projects":
      return "Projetos";
    case "certifications":
      return "Certificações";
    case "languages":
      return "Idiomas";
    case "custom":
      return "Nova seção";
    default:
      return "Seção";
  }
};





