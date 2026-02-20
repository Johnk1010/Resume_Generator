import { Router } from "express";
import multer from "multer";
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
  exportPdfController,
  getResumeController,
  importTemplateController,
  listResumesController,
  listVersionsController,
  restoreVersionController,
  updateResumeController
} from "../controllers/resume.controller.js";
import { requireAuth } from "../middleware/require-auth.js";
import { validateBody } from "../middleware/validate-body.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024
  }
});

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
router.post("/:id/import-template", upload.single("file"), importTemplateController);

export default router;
