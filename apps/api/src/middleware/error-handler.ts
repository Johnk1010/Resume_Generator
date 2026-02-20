import type { Request, Response, NextFunction } from "express";
import { HttpError } from "../lib/errors.js";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : "Erro interno";
  res.status(500).json({ message });
};

