import crypto from "node:crypto";

export const generateRefreshToken = (): string => {
  return crypto.randomBytes(48).toString("hex");
};

export const hashToken = (value: string): string => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

