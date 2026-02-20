import type {
  ResumeContent,
  ResumeDto,
  ResumeTheme,
  ResumeVersionDto,
  ResumeVersionSnapshot,
  TemplateId
} from "@curriculo/shared";
import type { ResumeRecord, ResumeVersionRecord } from "../models/resume.model.js";

const fromJson = <T>(value: unknown): T => {
  return value as T;
};

export const toResumeDto = (resume: ResumeRecord): ResumeDto => ({
  id: resume.id,
  userId: resume.userId,
  title: resume.title,
  templateId: resume.templateId as TemplateId,
  content: fromJson<ResumeContent>(resume.content),
  theme: fromJson<ResumeTheme>(resume.theme),
  createdAt: resume.createdAt.toISOString(),
  updatedAt: resume.updatedAt.toISOString()
});

export const toResumeVersionDto = (version: ResumeVersionRecord): ResumeVersionDto => ({
  id: version.id,
  resumeId: version.resumeId,
  name: version.name,
  snapshot: fromJson<ResumeVersionSnapshot>(version.snapshot),
  createdAt: version.createdAt.toISOString()
});

export const toResumeVersionSnapshot = (resume: ResumeRecord): ResumeVersionSnapshot => ({
  title: resume.title,
  templateId: resume.templateId as TemplateId,
  content: fromJson<ResumeContent>(resume.content),
  theme: fromJson<ResumeTheme>(resume.theme)
});

export const toInputJson = (value: unknown): unknown => {
  return value;
};