import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
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

  if (error instanceof MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ message: "Arquivo excede limite de 8MB." });
      return;
    }

    res.status(400).json({ message: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : "Erro interno";
  res.status(500).json({ message });
};

