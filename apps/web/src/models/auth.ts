import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
  TokensDto,
  UserDto
} from "@curriculo/shared";

interface LocalUser extends UserDto {
  password: string;
}

interface ResetTokenEntry {
  token: string;
  userId: string;
  expiresAt: string;
  usedAt: string | null;
}

const USERS_KEY = "curriculo_local_users";
const SESSION_KEY = "curriculo_local_session";
const RESET_TOKENS_KEY = "curriculo_local_reset_tokens";

const isBrowser = typeof window !== "undefined";

const defaultTokens: TokensDto = {
  accessToken: "local-access-token",
  refreshToken: "local-refresh-token"
};

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const readJson = <T>(key: string, fallback: T): T => {
  if (!isBrowser) {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJson = (key: string, value: unknown): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
};

const buildSeedUser = (): LocalUser => {
  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    name: "Usuario Demo",
    email: "demo@curriculo.com",
    password: "123456",
    createdAt: now,
    updatedAt: now
  };
};

const readUsers = (): LocalUser[] => {
  const users = readJson<LocalUser[]>(USERS_KEY, []);

  if (users.length > 0) {
    return users;
  }

  const seeded = [buildSeedUser()];
  writeUsers(seeded);
  return seeded;
};
const writeUsers = (users: LocalUser[]): void => writeJson(USERS_KEY, users);
const readResetTokens = (): ResetTokenEntry[] => readJson<ResetTokenEntry[]>(RESET_TOKENS_KEY, []);
const writeResetTokens = (tokens: ResetTokenEntry[]): void => writeJson(RESET_TOKENS_KEY, tokens);

const toUserDto = (user: LocalUser): UserDto => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const setSession = (userId: string): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(SESSION_KEY, userId);
};

const getSessionUserId = (): string | null => {
  if (!isBrowser) {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
};

export const clearLocalAuthSession = (): void => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
};

export interface AuthResponse {
  user: UserDto;
  tokens: TokensDto;
}

export const registerRequest = async (payload: RegisterInput): Promise<AuthResponse> => {
  const users = readUsers();
  const email = normalizeEmail(payload.email);

  if (users.some((user) => user.email === email)) {
    throw new Error("E-mail ja cadastrado");
  }

  const now = new Date().toISOString();

  const user: LocalUser = {
    id: crypto.randomUUID(),
    name: payload.name,
    email,
    password: payload.password,
    createdAt: now,
    updatedAt: now
  };

  users.push(user);
  writeUsers(users);
  setSession(user.id);

  return {
    user: toUserDto(user),
    tokens: defaultTokens
  };
};

export const loginRequest = async (payload: LoginInput): Promise<AuthResponse> => {
  const users = readUsers();
  const email = normalizeEmail(payload.email);

  const user = users.find((entry) => entry.email === email);

  if (!user || user.password !== payload.password) {
    throw new Error("Credenciais invalidas");
  }

  setSession(user.id);

  return {
    user: toUserDto(user),
    tokens: defaultTokens
  };
};

export const forgotPasswordRequest = async (payload: ForgotPasswordInput): Promise<{ message: string }> => {
  const users = readUsers();
  const email = normalizeEmail(payload.email);
  const user = users.find((entry) => entry.email === email);

  if (!user) {
    return { message: "Se o e-mail existir, um token local foi gerado." };
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const tokens = readResetTokens();

  tokens.push({
    token,
    userId: user.id,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    usedAt: null
  });

  writeResetTokens(tokens);
  console.log(`[local-forgot-password] ${user.email} -> token: ${token}`);

  return {
    message: `Token gerado localmente (veja o console): ${token}`
  };
};

export const resetPasswordRequest = async (payload: ResetPasswordInput): Promise<{ message: string }> => {
  const tokens = readResetTokens();
  const tokenEntry = tokens.find(
    (entry) =>
      entry.token === payload.token &&
      entry.usedAt === null &&
      new Date(entry.expiresAt).getTime() > Date.now()
  );

  if (!tokenEntry) {
    throw new Error("Token invalido ou expirado");
  }

  const users = readUsers();
  const user = users.find((entry) => entry.id === tokenEntry.userId);

  if (!user) {
    throw new Error("Usuario nao encontrado");
  }

  user.password = payload.newPassword;
  user.updatedAt = new Date().toISOString();
  writeUsers(users);

  tokenEntry.usedAt = new Date().toISOString();
  writeResetTokens(tokens);

  return { message: "Senha atualizada com sucesso." };
};

export const getMeRequest = async (): Promise<UserDto> => {
  const userId = getSessionUserId();

  if (!userId) {
    throw new Error("Sessao nao encontrada");
  }

  const users = readUsers();
  const user = users.find((entry) => entry.id === userId);

  if (!user) {
    throw new Error("Usuario nao encontrado");
  }

  return toUserDto(user);
};
