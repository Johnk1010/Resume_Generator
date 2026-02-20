import crypto from "node:crypto";
import { mutateLocalDb, readLocalDb } from "./local-db.model.js";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RefreshTokenRecord {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

interface PasswordResetTokenRecord {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface RefreshTokenWithUser extends RefreshTokenRecord {
  user: UserRecord;
}

export interface PasswordResetTokenWithUser extends PasswordResetTokenRecord {
  user: UserRecord;
}

const toUserRecord = (user: {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}): UserRecord => ({
  id: user.id,
  name: user.name,
  email: user.email,
  passwordHash: user.passwordHash,
  createdAt: new Date(user.createdAt),
  updatedAt: new Date(user.updatedAt)
});

const toRefreshTokenRecord = (token: {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}): RefreshTokenRecord => ({
  id: token.id,
  tokenHash: token.tokenHash,
  userId: token.userId,
  expiresAt: new Date(token.expiresAt),
  revokedAt: token.revokedAt ? new Date(token.revokedAt) : null,
  createdAt: new Date(token.createdAt)
});

const toPasswordResetTokenRecord = (token: {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}): PasswordResetTokenRecord => ({
  id: token.id,
  token: token.token,
  userId: token.userId,
  expiresAt: new Date(token.expiresAt),
  usedAt: token.usedAt ? new Date(token.usedAt) : null,
  createdAt: new Date(token.createdAt)
});

export const findUserByEmail = async (email: string): Promise<UserRecord | null> => {
  const db = await readLocalDb();
  const user = db.users.find((entry) => entry.email === email);
  return user ? toUserRecord(user) : null;
};

export const findUserById = async (userId: string): Promise<UserRecord | null> => {
  const db = await readLocalDb();
  const user = db.users.find((entry) => entry.id === userId);
  return user ? toUserRecord(user) : null;
};

export const createUser = async (input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<UserRecord> => {
  return mutateLocalDb((db) => {
    const now = new Date().toISOString();

    const user = {
      id: crypto.randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now
    };

    db.users.push(user);
    return toUserRecord(user);
  });
};

export const createRefreshToken = async (input: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<void> => {
  await mutateLocalDb((db) => {
    db.refreshTokens.push({
      id: crypto.randomUUID(),
      tokenHash: input.tokenHash,
      userId: input.userId,
      expiresAt: input.expiresAt.toISOString(),
      revokedAt: null,
      createdAt: new Date().toISOString()
    });
  });
};

export const findValidRefreshTokenWithUser = async (
  tokenHash: string
): Promise<RefreshTokenWithUser | null> => {
  const db = await readLocalDb();
  const now = Date.now();

  const token = db.refreshTokens.find(
    (entry) =>
      entry.tokenHash === tokenHash &&
      entry.revokedAt === null &&
      new Date(entry.expiresAt).getTime() > now
  );

  if (!token) {
    return null;
  }

  const user = db.users.find((entry) => entry.id === token.userId);

  if (!user) {
    return null;
  }

  return {
    ...toRefreshTokenRecord(token),
    user: toUserRecord(user)
  };
};

export const revokeRefreshToken = async (refreshTokenId: string): Promise<void> => {
  await mutateLocalDb((db) => {
    const token = db.refreshTokens.find((entry) => entry.id === refreshTokenId);

    if (token) {
      token.revokedAt = new Date().toISOString();
    }
  });
};

export const createPasswordResetToken = async (input: {
  token: string;
  userId: string;
  expiresAt: Date;
}): Promise<void> => {
  await mutateLocalDb((db) => {
    db.passwordResetTokens.push({
      id: crypto.randomUUID(),
      token: input.token,
      userId: input.userId,
      expiresAt: input.expiresAt.toISOString(),
      usedAt: null,
      createdAt: new Date().toISOString()
    });
  });
};

export const findValidPasswordResetTokenWithUser = async (
  token: string
): Promise<PasswordResetTokenWithUser | null> => {
  const db = await readLocalDb();
  const now = Date.now();

  const resetToken = db.passwordResetTokens.find(
    (entry) =>
      entry.token === token &&
      entry.usedAt === null &&
      new Date(entry.expiresAt).getTime() > now
  );

  if (!resetToken) {
    return null;
  }

  const user = db.users.find((entry) => entry.id === resetToken.userId);

  if (!user) {
    return null;
  }

  return {
    ...toPasswordResetTokenRecord(resetToken),
    user: toUserRecord(user)
  };
};

export const completePasswordReset = async (input: {
  userId: string;
  passwordResetTokenId: string;
  passwordHash: string;
}): Promise<void> => {
  await mutateLocalDb((db) => {
    const user = db.users.find((entry) => entry.id === input.userId);

    if (user) {
      user.passwordHash = input.passwordHash;
      user.updatedAt = new Date().toISOString();
    }

    const resetToken = db.passwordResetTokens.find(
      (entry) => entry.id === input.passwordResetTokenId
    );

    if (resetToken) {
      resetToken.usedAt = new Date().toISOString();
    }

    db.refreshTokens = db.refreshTokens.map((entry) => {
      if (entry.userId !== input.userId || entry.revokedAt) {
        return entry;
      }

      return {
        ...entry,
        revokedAt: new Date().toISOString()
      };
    });
  });
};