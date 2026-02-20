import { Router } from "express";
import { meController } from "../controllers/me.controller.js";
import { requireAuth } from "../middleware/require-auth.js";

const router = Router();

router.get("/", requireAuth, meController);

export default router;