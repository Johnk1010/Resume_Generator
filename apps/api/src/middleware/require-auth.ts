import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

const fallbackAuth = {
  userId: "local-user",
  email: "local@curriculo.dev"
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    req.auth = fallbackAuth;
    next();
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();

  try {
    req.auth = verifyAccessToken(token);
  } catch {
    req.auth = fallbackAuth;
  }

  next();
};