import type { RequestHandler } from "express";
import { getMe } from "../services/auth.service.js";

export const meController: RequestHandler = async (req, res, next) => {
  try {
    const me = await getMe(req.auth!.userId);
    res.json(me);
  } catch (error) {
    next(error);
  }
};