import { randomUUID } from "node:crypto";
import {
  buildDefaultResumeContent,
  defaultTheme,
  fontOptions,
  spacingOptions,
  templateIds,
  type HeaderContent,
  type ResumeContent,
  type ResumeSection,
  type ResumeTheme,
  type SectionType,
  type TemplateId
} from "@curriculo/shared";
import { z } from "zod";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/errors.js";

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_TEXT_FILE_CHARS = 18_000;
const MAX_SECTIONS = 10;
const MAX_ITEMS_PER_SECTION = 12;
const MAX_FIELD_LENGTH = 400;
const REQUEST_TIMEOUT_MS = 90_000;

export const llmProviders = ["gemini", "chatgpt"] as const;
export type LlmProvider = (typeof llmProviders)[number];

const promptOutputShape = `{
  "title": "string",
  "templateId": "minimal|modern|professional",
  "theme": {
    "primaryColor": "#RRGGBB",
    "secondaryColor": "#RRGGBB",
    "textColor": "#RRGGBB",
    "font": "sourceSans|merriweather|montserrat",
    "spacing": "compact|comfortable",
    "fontSizeLevel": "normal|large"
  },
  "header": {
    "fullName": "string",
    "role": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "linkedIn": "string",
    "github": "string"
  },
  "sections": [
    {
      "type": "summary|experience|education|skills|projects|certifications|languages|custom",
      "title": "string",
      "items": [
        { "text": "..." }
      ]
    }
  ]
}`;

const systemPrompt = `
Voce analisa modelos de curriculo (imagem ou arquivo) e converte para JSON estruturado.
Responda somente com JSON valido, sem markdown, sem explicacoes.

Regras:
- Mantenha a estrutura visual inferida no templateId e no tema.
- Extraia texto fiel do modelo quando possivel.
- Nao invente experiencias detalhadas; se faltar dado, use string vazia.
- Seja conciso: evite repeticoes e limite cada campo a poucas frases.
- Sempre inclua header e sections.
- Para cada section.type, use estes campos:
  - summary: text
  - experience: role, company, startDate, endDate, location, description
  - education: degree, institution, startDate, endDate, description
  - skills: name
  - projects: name, link, description
  - certifications: name, issuer, year
  - languages: language, level
  - custom: pares chave/valor livres

Formato de saida obrigatorio:
${promptOutputShape}
`.trim();

const aiDraftSchema = z
  .object({
    title: z.string().optional(),
    templateId: z.string().optional(),
    theme: z.record(z.string(), z.unknown()).optional(),
    header: z.record(z.string(), z.unknown()).optional(),
    sections: z.array(z.unknown()).optional(),
    content: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const sectionFieldMap: Record<Exclude<SectionType, "custom">, string[]> = {
  summary: ["text"],
  experience: ["role", "company", "startDate", "endDate", "location", "description"],
  education: ["degree", "institution", "startDate", "endDate", "description"],
  skills: ["name"],
  projects: ["name", "link", "description"],
  certifications: ["name", "issuer", "year"],
  languages: ["language", "level"]
};

const defaultSectionTitleMap: Record<SectionType, string> = {
  summary: "Resumo",
  experience: "Experiencia",
  education: "Educacao",
  skills: "Habilidades",
  projects: "Projetos",
  certifications: "Certificacoes",
  languages: "Idiomas",
  custom: "Nova secao"
};

interface NormalizedSectionItem {
  id: string;
  fields: Record<string, string>;
}

const fieldAliasMap: Record<string, string[]> = {
  text: ["text", "summary", "resumo", "descricao", "description"],
  role: ["role", "cargo", "position", "titulo"],
  company: ["company", "empresa", "organization", "organizacao"],
  startDate: ["startDate", "start", "inicio", "from", "de"],
  endDate: ["endDate", "end", "fim", "to", "ate"],
  location: ["location", "local", "cidade"],
  description: ["description", "descricao", "details", "detalhes"],
  degree: ["degree", "curso", "titulo", "formacao"],
  institution: ["institution", "instituicao", "school", "universidade"],
  name: ["name", "nome", "skill", "habilidade", "tecnologia"],
  link: ["link", "url", "website", "site"],
  issuer: ["issuer", "emissor", "org", "organization", "instituicao"],
  year: ["year", "ano"],
  language: ["language", "idioma"],
  level: ["level", "nivel", "proficiency", "fluency"]
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stripDiacritics = (value: string): string =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const normalizeToken = (value: string): string =>
  stripDiacritics(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const toSafeText = (value: unknown, maxLength = MAX_FIELD_LENGTH): string => {
  if (typeof value !== "string") {
    return "";
  }

  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return "";
  }

  return compact.slice(0, maxLength);
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeHexColor = (value: unknown, fallback: string): string => {
  if (typeof value !== "string") {
    return fallback;
  }

  const token = value.trim();
  if (!token) {
    return fallback;
  }

  const expanded = token.startsWith("#") ? token : `#${token}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(expanded)) {
    return expanded.toUpperCase();
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(expanded)) {
    const r = expanded[1];
    const g = expanded[2];
    const b = expanded[3];
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  return fallback;
};

const normalizeTemplateId = (value: unknown, fallback: TemplateId): TemplateId => {
  if (typeof value !== "string") {
    return fallback;
  }

  const token = value.trim() as TemplateId;
  return templateIds.includes(token) ? token : fallback;
};

const normalizeModelName = (value: unknown, fallback: string): string => {
  const candidate = toSafeText(value, 120);
  return candidate || fallback;
};

const normalizeProvider = (value: unknown): LlmProvider => {
  if (typeof value !== "string") {
    return "gemini";
  }

  const provider = value.trim().toLowerCase();

  if (provider === "chatgpt" || provider === "openai") {
    return "chatgpt";
  }

  if (provider === "gemini") {
    return "gemini";
  }

  throw new HttpError(400, "Provedor de IA invalido.");
};

interface ResolvedLlmSelection {
  provider: LlmProvider;
  model: string;
  apiKey: string;
}

const normalizeSectionType = (value: unknown): SectionType => {
  if (typeof value !== "string") {
    return "custom";
  }

  const token = normalizeToken(value);

  if (token.includes("summary") || token.includes("resumo") || token.includes("perfil")) {
    return "summary";
  }

  if (
    token.includes("experience") ||
    token.includes("experiencia") ||
    token.includes("work") ||
    token.includes("career")
  ) {
    return "experience";
  }

  if (
    token.includes("education") ||
    token.includes("educacao") ||
    token.includes("formacao") ||
    token.includes("academic")
  ) {
    return "education";
  }

  if (token.includes("skill") || token.includes("habilidade") || token.includes("competencia")) {
    return "skills";
  }

  if (token.includes("project") || token.includes("projeto")) {
    return "projects";
  }

  if (
    token.includes("certification") ||
    token.includes("certificacao") ||
    token.includes("certificate")
  ) {
    return "certifications";
  }

  if (token.includes("language") || token.includes("idioma")) {
    return "languages";
  }

  return "custom";
};

const normalizeHeader = (rawHeader: unknown, fallback: HeaderContent): HeaderContent => {
  const source = isRecord(rawHeader) ? rawHeader : {};

  return {
    fullName: toSafeText(source.fullName, 120) || fallback.fullName,
    role: toSafeText(source.role, 120) || fallback.role,
    email: toSafeText(source.email, 120) || fallback.email,
    phone: toSafeText(source.phone, 80) || fallback.phone,
    location: toSafeText(source.location, 120) || fallback.location,
    website: toSafeText(source.website, 160) || fallback.website,
    linkedIn: toSafeText(source.linkedIn ?? source.linkedin, 160) || fallback.linkedIn,
    github: toSafeText(source.github, 160) || fallback.github
  };
};

const buildFieldLookup = (rawFields: Record<string, unknown>): Map<string, string> => {
  const lookup = new Map<string, string>();

  for (const [key, value] of Object.entries(rawFields)) {
    const normalizedKey = normalizeToken(key);
    if (!normalizedKey) {
      continue;
    }

    const normalizedValue = toSafeText(value);
    if (!normalizedValue) {
      continue;
    }

    lookup.set(normalizedKey, normalizedValue);
  }

  return lookup;
};

const readField = (
  lookup: Map<string, string>,
  primaryKey: string,
  fallbackFields: Record<string, unknown>
): string => {
  const direct = toSafeText(fallbackFields[primaryKey]);
  if (direct) {
    return direct;
  }

  const aliases = fieldAliasMap[primaryKey] ?? [primaryKey];

  for (const alias of aliases) {
    const hit = lookup.get(normalizeToken(alias));
    if (hit) {
      return hit;
    }
  }

  return "";
};

const createEmptyFields = (type: SectionType): Record<string, string> => {
  if (type === "custom") {
    return { field_1: "" };
  }

  return (sectionFieldMap[type] ?? []).reduce<Record<string, string>>((acc, key) => {
    acc[key] = "";
    return acc;
  }, {});
};

const normalizeSectionItems = (type: SectionType, rawItems: unknown): NormalizedSectionItem[] => {
  const items = Array.isArray(rawItems) ? rawItems.slice(0, MAX_ITEMS_PER_SECTION) : [];

  const normalized = items
    .map<NormalizedSectionItem | null>((entry) => {
      if (!isRecord(entry)) {
        return null;
      }

      const sourceFields = isRecord(entry.fields) ? entry.fields : entry;

      if (type === "custom") {
        const fields = Object.entries(sourceFields).slice(0, 8).reduce<Record<string, string>>((acc, [key, value]) => {
          const normalizedKey = toSafeText(key, 30).replace(/\s+/g, "_");
          const normalizedValue = toSafeText(value);

          if (!normalizedKey || !normalizedValue) {
            return acc;
          }

          acc[normalizedKey] = normalizedValue;
          return acc;
        }, {});

        if (Object.keys(fields).length === 0) {
          return null;
        }

        return {
          id: randomUUID() as string,
          fields
        };
      }

      const lookup = buildFieldLookup(sourceFields);
      const fields = createEmptyFields(type);

      for (const key of sectionFieldMap[type]) {
        fields[key] = readField(lookup, key, sourceFields);
      }

      const hasValue = Object.values(fields).some((value) => value.length > 0);
      if (!hasValue) {
        return null;
      }

      return {
        id: randomUUID() as string,
        fields
      };
    })
    .filter((item): item is NormalizedSectionItem => item !== null);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      id: randomUUID() as string,
      fields: createEmptyFields(type)
    }
  ];
};

const normalizeSections = (rawSections: unknown, fallbackSections: ResumeSection[]): ResumeSection[] => {
  if (!Array.isArray(rawSections) || rawSections.length === 0) {
    return clone(fallbackSections);
  }

  const normalized = rawSections.slice(0, MAX_SECTIONS).flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const type = normalizeSectionType(entry.type);
    const title = toSafeText(entry.title, 60) || defaultSectionTitleMap[type] || "Secao";

    const items = normalizeSectionItems(type, entry.items);

    return [
      {
        id: randomUUID() as string,
        type,
        title,
        items
      }
    ];
  });

  if (normalized.length > 0) {
    return normalized;
  }

  return clone(fallbackSections);
};

const normalizeTheme = (rawTheme: unknown, fallbackTheme: ResumeTheme): ResumeTheme => {
  const source = isRecord(rawTheme) ? rawTheme : {};

  const font: ResumeTheme["font"] =
    typeof source.font === "string" && fontOptions.includes(source.font as (typeof fontOptions)[number])
      ? (source.font as ResumeTheme["font"])
      : fallbackTheme.font;

  const spacing: ResumeTheme["spacing"] =
    typeof source.spacing === "string" &&
    spacingOptions.includes(source.spacing as (typeof spacingOptions)[number])
      ? (source.spacing as ResumeTheme["spacing"])
      : fallbackTheme.spacing;

  const fontSizeLevel = source.fontSizeLevel === "large" || source.fontSizeLevel === "normal"
    ? source.fontSizeLevel
    : fallbackTheme.fontSizeLevel;

  return {
    primaryColor: normalizeHexColor(source.primaryColor, fallbackTheme.primaryColor),
    secondaryColor: normalizeHexColor(source.secondaryColor, fallbackTheme.secondaryColor),
    textColor: normalizeHexColor(source.textColor, fallbackTheme.textColor),
    font,
    spacing,
    fontSizeLevel
  };
};

const readGeminiOutputText = (responseBody: unknown): string => {
  if (!isRecord(responseBody)) {
    throw new HttpError(502, "Resposta invalida da IA.");
  }

  if (!Array.isArray(responseBody.candidates) || responseBody.candidates.length === 0) {
    const promptFeedback = responseBody.promptFeedback;
    if (isRecord(promptFeedback) && typeof promptFeedback.blockReason === "string") {
      throw new HttpError(502, `Resposta bloqueada pela IA: ${promptFeedback.blockReason}.`);
    }

    throw new HttpError(502, "A IA nao retornou candidatos para analise.");
  }

  const texts: string[] = [];

  for (const candidate of responseBody.candidates) {
    if (!isRecord(candidate) || !isRecord(candidate.content) || !Array.isArray(candidate.content.parts)) {
      continue;
    }

    for (const part of candidate.content.parts) {
      if (!isRecord(part)) {
        continue;
      }

      const text = part.text;
      if (typeof text === "string" && text.trim()) {
        texts.push(text.trim());
      }
    }
  }

  if (texts.length > 0) {
    return texts.join("\n").trim();
  }

  throw new HttpError(502, "A IA nao retornou texto para analise.");
};

const readOpenAIOutputText = (responseBody: unknown): string => {
  if (!isRecord(responseBody)) {
    throw new HttpError(502, "Resposta invalida da IA.");
  }

  if (typeof responseBody.output_text === "string" && responseBody.output_text.trim()) {
    return responseBody.output_text.trim();
  }

  if (!Array.isArray(responseBody.output)) {
    throw new HttpError(502, "A IA nao retornou conteudo para analise.");
  }

  const texts: string[] = [];

  for (const outputItem of responseBody.output) {
    if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (!isRecord(contentItem)) {
        continue;
      }

      const text = contentItem.text;
      if (typeof text === "string" && text.trim()) {
        texts.push(text.trim());
      }
    }
  }

  if (texts.length > 0) {
    return texts.join("\n").trim();
  }

  throw new HttpError(502, "A IA nao retornou texto para analise.");
};

const parseJsonFromModel = (modelText: string): unknown => {
  const withoutFence = modelText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const firstBrace = withoutFence.indexOf("{");
    const lastBrace = withoutFence.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new HttpError(502, "A IA retornou um formato invalido.");
    }

    const slice = withoutFence.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(slice);
    } catch {
      throw new HttpError(502, "Nao foi possivel interpretar o JSON da IA.");
    }
  }
};

const extractProviderErrorDetails = (
  rawText: string
): {
  message: string | null;
  statusCode: number | null;
} => {
  if (!rawText.trim()) {
    return { message: null, statusCode: null };
  }

  try {
    const parsed = JSON.parse(rawText) as unknown;
    if (!isRecord(parsed)) {
      return { message: null, statusCode: null };
    }

    const errorNode = parsed.error;
    if (!isRecord(errorNode)) {
      return { message: null, statusCode: null };
    }

    const message = typeof errorNode.message === "string" ? errorNode.message : null;
    const providerCode = typeof errorNode.code === "number" ? errorNode.code : null;
    const statusCode =
      providerCode !== null && providerCode >= 400 && providerCode <= 599 ? providerCode : null;

    return { message, statusCode };
  } catch {
    return { message: null, statusCode: null };
  }
};

const isTextLikeMime = (mimeType: string): boolean => {
  const token = mimeType.toLowerCase();

  if (token.startsWith("text/")) {
    return true;
  }

  return (
    token === "application/json" ||
    token === "application/xml" ||
    token === "application/x-yaml" ||
    token === "application/yaml"
  );
};

const toBase64 = (buffer: Buffer): string => {
  return buffer.toString("base64");
};

const toDataUrl = (buffer: Buffer, mimeType: string): string =>
  `data:${mimeType || "application/octet-stream"};base64,${toBase64(buffer)}`;

const resolveLlmSelection = (input: { llmProvider?: string; llmModel?: string }): ResolvedLlmSelection => {
  const provider = normalizeProvider(input.llmProvider);

  if (provider === "gemini") {
    if (!env.GEMINI_API_KEY) {
      throw new HttpError(503, "Gemini nao configurado. Defina GEMINI_API_KEY no apps/api/.env.");
    }

    return {
      provider,
      model: normalizeModelName(input.llmModel, env.GEMINI_MODEL),
      apiKey: env.GEMINI_API_KEY
    };
  }

  if (!env.OPENAI_API_KEY) {
    throw new HttpError(503, "ChatGPT nao configurado. Defina OPENAI_API_KEY no apps/api/.env.");
  }

  return {
    provider,
    model: normalizeModelName(input.llmModel, env.OPENAI_MODEL),
    apiKey: env.OPENAI_API_KEY
  };
};

const postJson = async (input: {
  url: string;
  apiKey?: string;
  body: unknown;
  signal: AbortSignal;
  extraHeaders?: Record<string, string>;
}): Promise<string> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...input.extraHeaders
  };

  if (input.apiKey) {
    headers.Authorization = `Bearer ${input.apiKey}`;
  }

  const response = await fetch(input.url, {
    method: "POST",
    headers,
    body: JSON.stringify(input.body),
    signal: input.signal
  });

  const responseText = await response.text();

  if (!response.ok) {
    const providerError = extractProviderErrorDetails(responseText);
    throw new HttpError(
      providerError.statusCode ?? response.status ?? 502,
      providerError.message
        ? `Falha na analise por IA: ${providerError.message}`
        : `Falha na analise por IA (status ${response.status}).`
    );
  }

  return responseText;
};

const buildUserInstructionText =
  "Copie fielmente a estrutura visual e textual do modelo de curriculo enviado para o formato JSON exigido. " +
  "O objetivo e permitir edicao completa no editor deste sistema sem perder o padrao do modelo.";

const requestModelTextFromGemini = async (
  selection: ResolvedLlmSelection,
  file: TemplateImportFile,
  signal: AbortSignal
): Promise<string> => {
  const parts: Array<Record<string, unknown>> = [{ text: buildUserInstructionText }];
  const mimeType = file.mimeType || "application/octet-stream";

  if (mimeType.toLowerCase().startsWith("image/")) {
    parts.push({
      inlineData: {
        mimeType,
        data: toBase64(file.buffer)
      }
    });
  } else if (isTextLikeMime(mimeType)) {
    parts.push({
      text: `Conteudo textual do arquivo:\n${file.buffer.toString("utf-8").slice(0, MAX_TEXT_FILE_CHARS)}`
    });
  } else {
    parts.push({
      inlineData: {
        mimeType,
        data: toBase64(file.buffer)
      }
    });
  }

  const payload = {
    systemInstruction: {
      role: "system",
      parts: [{ text: systemPrompt }]
    },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      thinkingConfig: {
        thinkingBudget: 0
      }
    }
  };

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selection.model)}:generateContent?key=${encodeURIComponent(selection.apiKey)}`;

  const responseText = await postJson({
    url: endpoint,
    body: payload,
    signal
  });

  let parsedProviderResponse: unknown;

  try {
    parsedProviderResponse = JSON.parse(responseText);
  } catch {
    throw new HttpError(502, "Resposta invalida do provedor de IA.");
  }

  return readGeminiOutputText(parsedProviderResponse);
};

const requestModelTextFromOpenAI = async (
  selection: ResolvedLlmSelection,
  file: TemplateImportFile,
  signal: AbortSignal
): Promise<string> => {
  const content: Array<Record<string, unknown>> = [
    {
      type: "input_text",
      text: buildUserInstructionText
    }
  ];

  const mimeType = file.mimeType || "application/octet-stream";

  if (mimeType.toLowerCase().startsWith("image/")) {
    content.push({
      type: "input_image",
      image_url: toDataUrl(file.buffer, mimeType),
      detail: "high"
    });
  } else if (isTextLikeMime(mimeType)) {
    content.push({
      type: "input_text",
      text: `Conteudo textual do arquivo:\n${file.buffer.toString("utf-8").slice(0, MAX_TEXT_FILE_CHARS)}`
    });
  } else {
    content.push({
      type: "input_file",
      filename: file.fileName || "modelo-curriculo",
      file_data: toDataUrl(file.buffer, mimeType)
    });
  }

  const payload = {
    model: selection.model,
    temperature: 0.1,
    max_output_tokens: 4096,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: systemPrompt }]
      },
      {
        role: "user",
        content
      }
    ]
  };

  const responseText = await postJson({
    url: "https://api.openai.com/v1/responses",
    apiKey: selection.apiKey,
    body: payload,
    signal
  });

  let parsedProviderResponse: unknown;

  try {
    parsedProviderResponse = JSON.parse(responseText);
  } catch {
    throw new HttpError(502, "Resposta invalida do provedor de IA.");
  }

  return readOpenAIOutputText(parsedProviderResponse);
};

export interface TemplateImportFile {
  fileName: string;
  mimeType: string;
  size: number;
  buffer: Buffer;
}

export interface AnalyzeTemplateInput {
  file: TemplateImportFile;
  llmProvider?: string;
  llmModel?: string;
  currentTitle: string;
  currentTemplateId: TemplateId;
  currentContent: ResumeContent;
  currentTheme: ResumeTheme;
}

export interface AnalyzeTemplateOutput {
  title: string;
  templateId: TemplateId;
  content: ResumeContent;
  theme: ResumeTheme;
}

export const analyzeTemplateWithAI = async (input: AnalyzeTemplateInput): Promise<AnalyzeTemplateOutput> => {
  if (!input.file.buffer.length || input.file.size <= 0) {
    throw new HttpError(400, "Arquivo vazio.");
  }

  if (input.file.size > MAX_FILE_SIZE_BYTES) {
    throw new HttpError(413, "Arquivo excede limite de 8MB.");
  }

  const selection = resolveLlmSelection({
    llmProvider: input.llmProvider,
    llmModel: input.llmModel
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let modelRawText = "";

  try {
    if (selection.provider === "gemini") {
      modelRawText = await requestModelTextFromGemini(selection, input.file, controller.signal);
    } else {
      modelRawText = await requestModelTextFromOpenAI(selection, input.file, controller.signal);
    }
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new HttpError(504, "Tempo limite excedido ao chamar a IA.");
    }

    throw new HttpError(502, "Nao foi possivel chamar o provedor de IA.");
  } finally {
    clearTimeout(timeout);
  }

  const jsonFromModel = parseJsonFromModel(modelRawText);
  let parsedDraft: z.infer<typeof aiDraftSchema>;

  try {
    parsedDraft = aiDraftSchema.parse(jsonFromModel);
  } catch {
    throw new HttpError(502, "A IA retornou estrutura fora do formato esperado.");
  }

  const contentNode = isRecord(parsedDraft.content) ? parsedDraft.content : {};
  const rawHeader = parsedDraft.header ?? (isRecord(contentNode.header) ? contentNode.header : {});
  const rawSections = parsedDraft.sections ?? contentNode.sections ?? [];
  const rawTheme = parsedDraft.theme ?? contentNode.theme ?? {};

  const defaultContent = buildDefaultResumeContent();
  const fallbackContent = clone(input.currentContent);
  const fallbackSections =
    fallbackContent.sections.length > 0 ? fallbackContent.sections : defaultContent.sections;

  const normalizedContent: ResumeContent = {
    header: normalizeHeader(rawHeader, fallbackContent.header),
    sections: normalizeSections(rawSections, fallbackSections)
  };

  return {
    title: toSafeText(parsedDraft.title, 120) || input.currentTitle,
    templateId: normalizeTemplateId(parsedDraft.templateId, input.currentTemplateId),
    content: normalizedContent,
    theme: normalizeTheme(rawTheme, input.currentTheme ?? defaultTheme)
  };
};
