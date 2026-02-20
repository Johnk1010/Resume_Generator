import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

interface LocalDbUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalDbRefreshToken {
  id: string;
  tokenHash: string;
  userId: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
}

interface LocalDbPasswordResetToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
  createdAt: string;
}

interface LocalDbResume {
  id: string;
  userId: string;
  title: string;
  templateId: string;
  content: unknown;
  theme: unknown;
  createdAt: string;
  updatedAt: string;
}

interface LocalDbResumeVersion {
  id: string;
  resumeId: string;
  name: string;
  snapshot: unknown;
  createdAt: string;
}

export interface LocalDbData {
  users: LocalDbUser[];
  refreshTokens: LocalDbRefreshToken[];
  passwordResetTokens: LocalDbPasswordResetToken[];
  resumes: LocalDbResume[];
  resumeVersions: LocalDbResumeVersion[];
}

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dataDir = path.join(packageRoot, "data");
const dbPath = path.join(dataDir, "local-db.json");

const emptyDb = (): LocalDbData => ({
  users: [],
  refreshTokens: [],
  passwordResetTokens: [],
  resumes: [],
  resumeVersions: []
});

let dbCache: LocalDbData | null = null;
let writeQueue: Promise<void> = Promise.resolve();

const clone = (db: LocalDbData): LocalDbData => {
  return JSON.parse(JSON.stringify(db)) as LocalDbData;
};

const loadDb = async (): Promise<LocalDbData> => {
  if (dbCache) {
    return dbCache;
  }

  await fs.mkdir(dataDir, { recursive: true });

  try {
    const raw = await fs.readFile(dbPath, "utf8");
    dbCache = JSON.parse(raw) as LocalDbData;
  } catch (error) {
    const isNotFound =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT";

    if (!isNotFound) {
      throw error;
    }

    dbCache = emptyDb();
    await fs.writeFile(dbPath, JSON.stringify(dbCache, null, 2), "utf8");
  }

  return dbCache;
};

const persistDb = async (db: LocalDbData): Promise<void> => {
  const snapshot = clone(db);

  writeQueue = writeQueue
    .then(async () => {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(snapshot, null, 2), "utf8");
    })
    .catch(async () => {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(dbPath, JSON.stringify(snapshot, null, 2), "utf8");
    });

  await writeQueue;
};

export const readLocalDb = async (): Promise<LocalDbData> => {
  const db = await loadDb();
  return clone(db);
};

export const mutateLocalDb = async <T>(mutator: (db: LocalDbData) => T | Promise<T>): Promise<T> => {
  const db = await loadDb();
  const result = await mutator(db);
  await persistDb(db);
  return result;
};