import type { TokensDto, UserDto } from "@curriculo/shared";
import type { UserRecord } from "../models/auth.model.js";

export const toUserDto = (user: UserRecord): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString()
});

export const toAuthResponse = (user: UserRecord, tokens: TokensDto) => ({
  user: toUserDto(user),
  tokens
});

export const toMessageResponse = (message: string) => ({ message });