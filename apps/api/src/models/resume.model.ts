import crypto from "node:crypto";
import { mutateLocalDb, readLocalDb } from "./local-db.model.js";

export interface ResumeRecord {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  content: unknown;
  theme: unknown;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResumeVersionRecord {
  id: string;
  resumeId: string;
  name: string;
  snapshot: unknown;
  createdAt: Date;
}

const toResumeRecord = (resume: {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  content: unknown;
  theme: unknown;
  createdAt: string;
  updatedAt: string;
}): ResumeRecord => ({
  id: resume.id,
  userId: resume.userId,
  title: resume.title,
  templateId: resume.templateId,
  content: resume.content,
  theme: resume.theme,
  createdAt: new Date(resume.createdAt),
  updatedAt: new Date(resume.updatedAt)
});

const toResumeVersionRecord = (version: {
  id: string;
  resumeId: string;
  name: string;
  snapshot: unknown;
  createdAt: string;
}): ResumeVersionRecord => ({
  id: version.id,
  resumeId: version.resumeId,
  name: version.name,
  snapshot: version.snapshot,
  createdAt: new Date(version.createdAt)
});

export const listResumesByUser = async (userId: string): Promise<ResumeRecord[]> => {
  const db = await readLocalDb();

  return db.resumes
    .filter((resume) => resume.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(toResumeRecord);
};

export const createResumeRecord = async (input: {
  userId: string;
  title: string;
  templateId: string;
  content: unknown;
  theme: unknown;
}): Promise<ResumeRecord> => {
  return mutateLocalDb((db) => {
    const now = new Date().toISOString();

    const resume = {
      id: crypto.randomUUID(),
      userId: input.userId,
      title: input.title,
      templateId: input.templateId,
      content: input.content,
      theme: input.theme,
      createdAt: now,
      updatedAt: now
    };

    db.resumes.push(resume);
    return toResumeRecord(resume);
  });
};

export const findResumeByIdAndUser = async (
  resumeId: string,
  userId: string
): Promise<ResumeRecord | null> => {
  const db = await readLocalDb();
  const resume = db.resumes.find((entry) => entry.id === resumeId && entry.userId === userId);
  return resume ? toResumeRecord(resume) : null;
};

export const updateResumeRecord = async (
  resumeId: string,
  data: {
    title?: string;
    templateId?: string;
    content?: unknown;
    theme?: unknown;
  }
): Promise<ResumeRecord> => {
  return mutateLocalDb((db) => {
    const resume = db.resumes.find((entry) => entry.id === resumeId);

    if (!resume) {
      throw new Error("Resume not found");
    }

    if (typeof data.title === "string") {
      resume.title = data.title;
    }

    if (typeof data.templateId === "string") {
      resume.templateId = data.templateId;
    }

    if (data.content !== undefined) {
      resume.content = data.content;
    }

    if (data.theme !== undefined) {
      resume.theme = data.theme;
    }

    resume.updatedAt = new Date().toISOString();
    return toResumeRecord(resume);
  });
};

export const deleteResumeRecord = async (resumeId: string): Promise<void> => {
  await mutateLocalDb((db) => {
    db.resumes = db.resumes.filter((entry) => entry.id !== resumeId);
    db.resumeVersions = db.resumeVersions.filter((entry) => entry.resumeId !== resumeId);
  });
};

export const listVersionsByResume = async (resumeId: string): Promise<ResumeVersionRecord[]> => {
  const db = await readLocalDb();

  return db.resumeVersions
    .filter((entry) => entry.resumeId === resumeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toResumeVersionRecord);
};

export const createResumeVersionRecord = async (input: {
  resumeId: string;
  name: string;
  snapshot: unknown;
}): Promise<ResumeVersionRecord> => {
  return mutateLocalDb((db) => {
    const version = {
      id: crypto.randomUUID(),
      resumeId: input.resumeId,
      name: input.name,
      snapshot: input.snapshot,
      createdAt: new Date().toISOString()
    };

    db.resumeVersions.push(version);
    return toResumeVersionRecord(version);
  });
};

export const findVersionByIdAndResume = async (
  versionId: string,
  resumeId: string
): Promise<ResumeVersionRecord | null> => {
  const db = await readLocalDb();
  const version = db.resumeVersions.find(
    (entry) => entry.id === versionId && entry.resumeId === resumeId
  );

  return version ? toResumeVersionRecord(version) : null;
};