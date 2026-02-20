import { Router } from "express";
import {
  createResumeSchema,
  createVersionSchema,
  updateResumeSchema
} from "@curriculo/shared";
import {
  createResumeController,
  createVersionController,
  deleteResumeController,
  duplicateResumeController,
  exportDocxController,
  exportPdfController,
  getResumeController,
  listResumesController,
  listVersionsController,
  restoreVersionController,
  updateResumeController
} from "../controllers/resume.controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate-body.js";

const router = Router();

router.use(requireAuth);

router.get("/", listResumesController);
router.post("/", validateBody(createResumeSchema), createResumeController);
router.get("/:id", getResumeController);
router.put("/:id", validateBody(updateResumeSchema), updateResumeController);
router.delete("/:id", deleteResumeController);
router.post("/:id/duplicate", duplicateResumeController);
router.get("/:id/versions", listVersionsController);
router.post("/:id/versions", validateBody(createVersionSchema), createVersionController);
router.post("/:id/versions/:versionId/restore", restoreVersionController);
router.get("/:id/export/pdf", exportPdfController);
router.get("/:id/export/docx", exportDocxController);

export default router;