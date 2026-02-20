import jwt from "jsonwebtoken";
import { env } from "./env.js";

interface AccessTokenPayload {
  email: string;
}

export const signAccessToken = (userId: string, email: string): string => {
  return jwt.sign({ email } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"]
  });
};

export const verifyAccessToken = (token: string): { userId: string; email: string } => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Token inválido");
  }

  return {
    userId: payload.sub,
    email: payload.email
  };
};

