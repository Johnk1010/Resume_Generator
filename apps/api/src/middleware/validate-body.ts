import type { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { HttpError } from "../lib/errors.js";

export const validateBody = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      next(new HttpError(400, parsed.error.errors.map((error) => error.message).join(", ")));
      return;
    }

    req.body = parsed.data;
    next();
  };
};

