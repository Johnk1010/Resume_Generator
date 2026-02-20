import type { RequestHandler } from "express";
import { HttpError } from "../lib/errors.js";
import { buildExportBaseName, exportPdf } from "../services/export.service.js";
import {
  createResume,
  createVersion,
  deleteResume,
  duplicateResume,
  getResume,
  getResumeForExport,
  importTemplateIntoResume,
  listResumes,
  listVersions,
  restoreVersion,
  updateResume
} from "../services/resume.service.js";

const normalizeParam = (value: string | string[] | undefined): string => {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
};

const readResumeId = (raw: string | string[] | undefined): string => {
  const resumeId = normalizeParam(raw);

  if (!resumeId) {
    throw new HttpError(400, "id e obrigatorio");
  }

  return resumeId;
};

export const listResumesController: RequestHandler = async (req, res, next) => {
  try {
    const data = await listResumes(req.auth!.userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
};

export const createResumeController: RequestHandler = async (req, res, next) => {
  try {
    const created = await createResume(req.auth!.userId, req.body);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
};

export const getResumeController: RequestHandler = async (req, res, next) => {
  try {
    const resume = await getResume(req.auth!.userId, readResumeId(req.params.id));
    res.json(resume);
  } catch (error) {
    next(error);
  }
};

export const updateResumeController: RequestHandler = async (req, res, next) => {
  try {
    const updated = await updateResume(req.auth!.userId, readResumeId(req.params.id), req.body);
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

export const deleteResumeController: RequestHandler = async (req, res, next) => {
  try {
    await deleteResume(req.auth!.userId, readResumeId(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const duplicateResumeController: RequestHandler = async (req, res, next) => {
  try {
    const duplicate = await duplicateResume(req.auth!.userId, readResumeId(req.params.id));
    res.status(201).json(duplicate);
  } catch (error) {
    next(error);
  }
};

export const listVersionsController: RequestHandler = async (req, res, next) => {
  try {
    const versions = await listVersions(req.auth!.userId, readResumeId(req.params.id));
    res.json(versions);
  } catch (error) {
    next(error);
  }
};

export const createVersionController: RequestHandler = async (req, res, next) => {
  try {
    const version = await createVersion(req.auth!.userId, readResumeId(req.params.id), req.body);
    res.status(201).json(version);
  } catch (error) {
    next(error);
  }
};

export const restoreVersionController: RequestHandler = async (req, res, next) => {
  try {
    const versionId = normalizeParam(req.params.versionId);

    if (!versionId) {
      throw new HttpError(400, "versionId e obrigatorio");
    }

    const restored = await restoreVersion(req.auth!.userId, readResumeId(req.params.id), versionId);
    res.json(restored);
  } catch (error) {
    next(error);
  }
};

export const exportPdfController: RequestHandler = async (req, res, next) => {
  try {
    const resume = await getResumeForExport(req.auth!.userId, readResumeId(req.params.id));
    const fileBaseName = buildExportBaseName(resume);
    const pdf = await exportPdf(resume);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=\"${fileBaseName}.pdf\"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
};

export const importTemplateController: RequestHandler = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new HttpError(400, "Arquivo do modelo e obrigatorio");
    }

    const llmProvider = typeof req.body?.llmProvider === "string" ? req.body.llmProvider : undefined;
    const llmModel = typeof req.body?.llmModel === "string" ? req.body.llmModel : undefined;

    const updated = await importTemplateIntoResume(req.auth!.userId, readResumeId(req.params.id), {
      file: {
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        buffer: req.file.buffer
      },
      llmProvider,
      llmModel
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
};
