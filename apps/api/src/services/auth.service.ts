import bcrypt from "bcrypt";
import crypto from "node:crypto";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  TokensDto,
  UserDto
} from "@curriculo/shared";
import { env } from "../lib/env.js";
import { HttpError } from "../lib/errors.js";
import { signAccessToken } from "../lib/jwt.js";
import { generateRefreshToken, hashToken } from "../lib/tokens.js";
import {
  completePasswordReset,
  createPasswordResetToken,
  createRefreshToken,
  createUser,
  findUserByEmail,
  findUserById,
  findValidPasswordResetTokenWithUser,
  findValidRefreshTokenWithUser,
  revokeRefreshToken,
  type UserRecord
} from "../models/auth.model.js";
import { toAuthResponse, toUserDto } from "../views/auth.view.js";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const refreshExpirationDate = (): Date => {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
};

const createSession = async (user: Pick<UserRecord, "id" | "email">): Promise<TokensDto> => {
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashToken(refreshToken);

  await createRefreshToken({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: refreshExpirationDate()
  });

  return {
    accessToken: signAccessToken(user.id, user.email),
    refreshToken
  };
};

export const register = async (input: RegisterInput): Promise<{ user: UserDto; tokens: TokensDto }> => {
  const email = normalizeEmail(input.email);
  const existing = await findUserByEmail(email);

  if (existing) {
    throw new HttpError(409, "E-mail ja cadastrado");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await createUser({
    name: input.name,
    email,
    passwordHash
  });

  const tokens = await createSession(user);
  return toAuthResponse(user, tokens);
};

export const login = async (input: LoginInput): Promise<{ user: UserDto; tokens: TokensDto }> => {
  const email = normalizeEmail(input.email);
  const user = await findUserByEmail(email);

  if (!user) {
    throw new HttpError(401, "Credenciais invalidas");
  }

  const isValidPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new HttpError(401, "Credenciais invalidas");
  }

  const tokens = await createSession(user);
  return toAuthResponse(user, tokens);
};

export const refresh = async (refreshToken: string): Promise<TokensDto> => {
  const refreshTokenHash = hashToken(refreshToken);
  const storedToken = await findValidRefreshTokenWithUser(refreshTokenHash);

  if (!storedToken) {
    throw new HttpError(401, "Refresh token invalido");
  }

  await revokeRefreshToken(storedToken.id);
  return createSession(storedToken.user);
};

export const forgotPassword = async ({ email }: ForgotPasswordInput): Promise<void> => {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");

  await createPasswordResetToken({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60)
  });

  const resetUrl = `${env.WEB_URL}/reset-password?token=${token}`;
  console.log(`[forgot-password] ${user.email} -> ${resetUrl}`);
};

export const resetPassword = async ({ token, newPassword }: ResetPasswordInput): Promise<void> => {
  const resetToken = await findValidPasswordResetTokenWithUser(token);

  if (!resetToken) {
    throw new HttpError(400, "Token de reset invalido ou expirado");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await completePasswordReset({
    userId: resetToken.userId,
    passwordResetTokenId: resetToken.id,
    passwordHash
  });
};

export const getMe = async (userId: string): Promise<UserDto> => {
  const user = await findUserById(userId);

  if (!user) {
    if (userId === "local-user") {
      return {
        id: "local-user",
        name: "Usuario Local",
        email: "local@curriculo.dev",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    throw new HttpError(404, "Usuario nao encontrado");
  }

  return toUserDto(user);
};
