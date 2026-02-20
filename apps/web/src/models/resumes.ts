import type {
  CreateResumeInput,
  CreateVersionInput,
  ResumeContent,
  ResumeDto,
  ResumeTheme,
  ResumeVersionDto,
  UpdateResumeInput
} from "@curriculo/shared";
import { buildDefaultResumeContent, defaultTheme } from "@curriculo/shared";
import axios from "axios";
import { api } from "./client";

interface LocalResumeRecord {
  id: string;
  userId: string;
  title: string;
  templateId: ResumeDto["templateId"];
  content: ResumeContent;
  theme: ResumeTheme;
  createdAt: string;
  updatedAt: string;
}

interface LocalVersionRecord {
  id: string;
  resumeId: string;
  name: string;
  snapshot: {
    title: string;
    templateId: ResumeDto["templateId"];
    content: ResumeContent;
    theme: ResumeTheme;
  };
  createdAt: string;
}

const LOCAL_RESUMES_KEY = "curriculo_local_resumes";
const LOCAL_VERSIONS_KEY = "curriculo_local_versions";
const LOCAL_SESSION_KEY = "curriculo_local_session";
const LOCAL_USERS_KEY = "curriculo_local_users";
const USE_API = import.meta.env.VITE_USE_API !== "false";

const readJson = <T>(key: string, fallback: T): T => {
  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  window.localStorage.setItem(key, JSON.stringify(value));
};

const readResumes = (): LocalResumeRecord[] => readJson<LocalResumeRecord[]>(LOCAL_RESUMES_KEY, []);
const writeResumes = (resumes: LocalResumeRecord[]) => writeJson(LOCAL_RESUMES_KEY, resumes);

const readVersions = (): LocalVersionRecord[] => readJson<LocalVersionRecord[]>(LOCAL_VERSIONS_KEY, []);
const writeVersions = (versions: LocalVersionRecord[]) => writeJson(LOCAL_VERSIONS_KEY, versions);

const getSessionUserId = (): string => {
  const userId = window.localStorage.getItem(LOCAL_SESSION_KEY);
  if (userId) {
    return userId;
  }

  const users = readJson<Array<{ id: string }>>(LOCAL_USERS_KEY, []);
  const fallbackUserId = users[0]?.id ?? "local-user";
  window.localStorage.setItem(LOCAL_SESSION_KEY, fallbackUserId);
  return fallbackUserId;
};

const isApiUnavailable = (error: unknown): boolean => {
  if (axios.isAxiosError(error)) {
    return !error.response;
  }

  return false;
};

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const toResumeDto = (resume: LocalResumeRecord): ResumeDto => ({
  ...resume,
  content: clone(resume.content),
  theme: clone(resume.theme)
});

const toVersionDto = (version: LocalVersionRecord): ResumeVersionDto => ({
  ...version,
  snapshot: clone(version.snapshot)
});

const localListResumes = async (): Promise<ResumeDto[]> => {
  const userId = getSessionUserId();

  return readResumes()
    .filter((resume) => resume.userId === userId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map(toResumeDto);
};

const localCreateResume = async (payload: CreateResumeInput): Promise<ResumeDto> => {
  const userId = getSessionUserId();
  const now = new Date().toISOString();

  const resume: LocalResumeRecord = {
    id: crypto.randomUUID(),
    userId,
    title: payload.title,
    templateId: payload.templateId,
    content: buildDefaultResumeContent(),
    theme: clone(defaultTheme),
    createdAt: now,
    updatedAt: now
  };

  const resumes = readResumes();
  resumes.push(resume);
  writeResumes(resumes);

  return toResumeDto(resume);
};

const localGetResume = async (id: string): Promise<ResumeDto> => {
  const userId = getSessionUserId();
  const resume = readResumes().find((entry) => entry.id === id && entry.userId === userId);

  if (!resume) {
    throw new Error("Curriculo nao encontrado");
  }

  return toResumeDto(resume);
};

const localUpdateResume = async (id: string, payload: UpdateResumeInput): Promise<ResumeDto> => {
  const userId = getSessionUserId();
  const resumes = readResumes();
  const resume = resumes.find((entry) => entry.id === id && entry.userId === userId);

  if (!resume) {
    throw new Error("Curriculo nao encontrado");
  }

  if (payload.title !== undefined) {
    resume.title = payload.title;
  }

  if (payload.templateId !== undefined) {
    resume.templateId = payload.templateId;
  }

  if (payload.content !== undefined) {
    resume.content = clone(payload.content);
  }

  if (payload.theme !== undefined) {
    resume.theme = clone(payload.theme);
  }

  resume.updatedAt = new Date().toISOString();
  writeResumes(resumes);

  return toResumeDto(resume);
};

const localDeleteResume = async (id: string): Promise<void> => {
  const userId = getSessionUserId();

  const resumes = readResumes().filter((entry) => !(entry.id === id && entry.userId === userId));
  writeResumes(resumes);

  const versions = readVersions().filter((entry) => entry.resumeId !== id);
  writeVersions(versions);
};

const localDuplicateResume = async (id: string): Promise<ResumeDto> => {
  const source = await localGetResume(id);
  const now = new Date().toISOString();

  const duplicate: LocalResumeRecord = {
    ...clone(source),
    id: crypto.randomUUID(),
    title: `${source.title} (Copia)`,
    createdAt: now,
    updatedAt: now
  };

  const resumes = readResumes();
  resumes.push(duplicate);
  writeResumes(resumes);

  return toResumeDto(duplicate);
};

const localListVersions = async (id: string): Promise<ResumeVersionDto[]> => {
  await localGetResume(id);

  return readVersions()
    .filter((entry) => entry.resumeId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map(toVersionDto);
};

const localCreateVersion = async (id: string, payload: CreateVersionInput): Promise<ResumeVersionDto> => {
  const resume = await localGetResume(id);

  const version: LocalVersionRecord = {
    id: crypto.randomUUID(),
    resumeId: id,
    name: payload.name,
    snapshot: {
      title: resume.title,
      templateId: resume.templateId,
      content: clone(resume.content),
      theme: clone(resume.theme)
    },
    createdAt: new Date().toISOString()
  };

  const versions = readVersions();
  versions.push(version);
  writeVersions(versions);

  return toVersionDto(version);
};

const localRestoreVersion = async (id: string, versionId: string): Promise<ResumeDto> => {
  const version = readVersions().find((entry) => entry.id === versionId && entry.resumeId === id);

  if (!version) {
    throw new Error("Versao nao encontrada");
  }

  return localUpdateResume(id, {
    title: version.snapshot.title,
    templateId: version.snapshot.templateId,
    content: version.snapshot.content,
    theme: version.snapshot.theme
  });
};

export const listResumesRequest = async (): Promise<ResumeDto[]> => {
  if (!USE_API) {
    return localListResumes();
  }

  try {
    const response = await api.get<ResumeDto[]>("/resumes");
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localListResumes();
    }

    throw error;
  }
};

export const createResumeRequest = async (payload: CreateResumeInput): Promise<ResumeDto> => {
  if (!USE_API) {
    return localCreateResume(payload);
  }

  try {
    const response = await api.post<ResumeDto>("/resumes", payload);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localCreateResume(payload);
    }

    throw error;
  }
};

export const getResumeRequest = async (id: string): Promise<ResumeDto> => {
  if (!USE_API) {
    return localGetResume(id);
  }

  try {
    const response = await api.get<ResumeDto>(`/resumes/${id}`);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localGetResume(id);
    }

    throw error;
  }
};

export const updateResumeRequest = async (id: string, payload: UpdateResumeInput): Promise<ResumeDto> => {
  if (!USE_API) {
    return localUpdateResume(id, payload);
  }

  try {
    const response = await api.put<ResumeDto>(`/resumes/${id}`, payload);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localUpdateResume(id, payload);
    }

    throw error;
  }
};

export const deleteResumeRequest = async (id: string): Promise<void> => {
  if (!USE_API) {
    await localDeleteResume(id);
    return;
  }

  try {
    await api.delete(`/resumes/${id}`);
  } catch (error) {
    if (isApiUnavailable(error)) {
      await localDeleteResume(id);
      return;
    }

    throw error;
  }
};

export const duplicateResumeRequest = async (id: string): Promise<ResumeDto> => {
  if (!USE_API) {
    return localDuplicateResume(id);
  }

  try {
    const response = await api.post<ResumeDto>(`/resumes/${id}/duplicate`);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localDuplicateResume(id);
    }

    throw error;
  }
};

export const listVersionsRequest = async (id: string): Promise<ResumeVersionDto[]> => {
  if (!USE_API) {
    return localListVersions(id);
  }

  try {
    const response = await api.get<ResumeVersionDto[]>(`/resumes/${id}/versions`);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localListVersions(id);
    }

    throw error;
  }
};

export const createVersionRequest = async (
  id: string,
  payload: CreateVersionInput
): Promise<ResumeVersionDto> => {
  if (!USE_API) {
    return localCreateVersion(id, payload);
  }

  try {
    const response = await api.post<ResumeVersionDto>(`/resumes/${id}/versions`, payload);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localCreateVersion(id, payload);
    }

    throw error;
  }
};

export const restoreVersionRequest = async (id: string, versionId: string): Promise<ResumeDto> => {
  if (!USE_API) {
    return localRestoreVersion(id, versionId);
  }

  try {
    const response = await api.post<ResumeDto>(`/resumes/${id}/versions/${versionId}/restore`);
    return response.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return localRestoreVersion(id, versionId);
    }

    throw error;
  }
};

export const downloadExportRequest = async (
  id: string,
  format: "pdf" | "docx"
): Promise<{ blob: Blob; fileName: string }> => {
  if (!USE_API) {
    throw new Error("Exportacao requer API ativa. Defina VITE_USE_API=true para habilitar.");
  }

  try {
    const response = await api.get(`/resumes/${id}/export/${format}`, {
      responseType: "blob"
    });

    const header = response.headers["content-disposition"] as string | undefined;
    const fileName = header?.match(/filename="?([^\"]+)"?/i)?.[1] ?? `curriculo.${format}`;

    return {
      blob: response.data,
      fileName
    };
  } catch (error) {
    if (isApiUnavailable(error)) {
      throw new Error("Exportacao requer API ativa em http://localhost:3333");
    }

    throw error;
  }
};
