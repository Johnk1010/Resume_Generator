import { Router } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema
} from "@curriculo/shared";
import {
  forgotPasswordController,
  loginController,
  refreshController,
  registerController,
  resetPasswordController
} from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate-body.js";

const router = Router();

router.post("/register", validateBody(registerSchema), registerController);
router.post("/login", validateBody(loginSchema), loginController);
router.post("/refresh", refreshController);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);

export default router;