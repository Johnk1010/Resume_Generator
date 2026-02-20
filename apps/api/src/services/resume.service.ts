import type {
  CreateResumeInput,
  CreateVersionInput,
  ResumeDto,
  ResumeVersionDto,
  UpdateResumeInput
} from "@curriculo/shared";
import { buildDefaultResumeContent, defaultTheme } from "@curriculo/shared";
import { HttpError } from "../lib/errors.js";
import {
  createResumeRecord,
  createResumeVersionRecord,
  deleteResumeRecord,
  findResumeByIdAndUser,
  findVersionByIdAndResume,
  listResumesByUser,
  listVersionsByResume,
  updateResumeRecord
} from "../models/resume.model.js";
import {
  toInputJson,
  toResumeDto,
  toResumeVersionDto,
  toResumeVersionSnapshot
} from "../views/resume.view.js";
import { analyzeTemplateWithAI, type TemplateImportFile } from "./template-import.service.js";

const getOwnedResumeOrThrow = async (resumeId: string, userId: string) => {
  const resume = await findResumeByIdAndUser(resumeId, userId);

  if (!resume) {
    throw new HttpError(404, "Curriculo nao encontrado");
  }

  return resume;
};

export const listResumes = async (userId: string): Promise<ResumeDto[]> => {
  const resumes = await listResumesByUser(userId);
  return resumes.map(toResumeDto);
};

export const createResume = async (userId: string, input: CreateResumeInput): Promise<ResumeDto> => {
  const resume = await createResumeRecord({
    userId,
    title: input.title,
    templateId: input.templateId,
    content: toInputJson(buildDefaultResumeContent()),
    theme: toInputJson(defaultTheme)
  });

  return toResumeDto(resume);
};

export const getResume = async (userId: string, resumeId: string): Promise<ResumeDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  return toResumeDto(resume);
};

export const updateResume = async (
  userId: string,
  resumeId: string,
  input: UpdateResumeInput
): Promise<ResumeDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);

  const updated = await updateResumeRecord(resume.id, {
    title: input.title,
    templateId: input.templateId,
    content: input.content ? toInputJson(input.content) : undefined,
    theme: input.theme ? toInputJson(input.theme) : undefined
  });

  return toResumeDto(updated);
};

export const deleteResume = async (userId: string, resumeId: string): Promise<void> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  await deleteResumeRecord(resume.id);
};

export const duplicateResume = async (userId: string, resumeId: string): Promise<ResumeDto> => {
  const source = await getOwnedResumeOrThrow(resumeId, userId);

  const duplicate = await createResumeRecord({
    userId,
    title: `${source.title} (Copia)`,
    templateId: source.templateId,
    content: toInputJson(source.content),
    theme: toInputJson(source.theme)
  });

  return toResumeDto(duplicate);
};

export const listVersions = async (userId: string, resumeId: string): Promise<ResumeVersionDto[]> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const versions = await listVersionsByResume(resume.id);
  return versions.map(toResumeVersionDto);
};

export const createVersion = async (
  userId: string,
  resumeId: string,
  input: CreateVersionInput
): Promise<ResumeVersionDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);

  const version = await createResumeVersionRecord({
    resumeId: resume.id,
    name: input.name,
    snapshot: toInputJson(toResumeVersionSnapshot(resume))
  });

  return toResumeVersionDto(version);
};

export const restoreVersion = async (
  userId: string,
  resumeId: string,
  versionId: string
): Promise<ResumeDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const version = await findVersionByIdAndResume(versionId, resume.id);

  if (!version) {
    throw new HttpError(404, "Versao nao encontrada");
  }

  const snapshot = toResumeVersionDto(version).snapshot;

  const updated = await updateResumeRecord(resume.id, {
    title: snapshot.title,
    templateId: snapshot.templateId,
    content: toInputJson(snapshot.content),
    theme: toInputJson(snapshot.theme)
  });

  return toResumeDto(updated);
};

export const getResumeForExport = async (userId: string, resumeId: string): Promise<ResumeDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  return toResumeDto(resume);
};

export const importTemplateIntoResume = async (
  userId: string,
  resumeId: string,
  input: {
    file: TemplateImportFile;
    llmProvider?: string;
    llmModel?: string;
  }
): Promise<ResumeDto> => {
  const resume = await getOwnedResumeOrThrow(resumeId, userId);
  const resumeDto = toResumeDto(resume);

  const analyzed = await analyzeTemplateWithAI({
    file: input.file,
    llmProvider: input.llmProvider,
    llmModel: input.llmModel,
    currentTitle: resume.title,
    currentTemplateId: resume.templateId as ResumeDto["templateId"],
    currentContent: resumeDto.content,
    currentTheme: resumeDto.theme
  });

  const updated = await updateResumeRecord(resume.id, {
    title: analyzed.title,
    templateId: analyzed.templateId,
    content: toInputJson(analyzed.content),
    theme: toInputJson(analyzed.theme)
  });

  return toResumeDto(updated);
};
