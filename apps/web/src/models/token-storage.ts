export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

const TOKEN_KEY = "curriculo_tokens";
let memoryTokens: SessionTokens | null = null;

const isBrowser = typeof window !== "undefined";

const readTokensFromStorage = (): SessionTokens | null => {
  if (!isBrowser) {
    return null;
  }

  const raw = window.localStorage.getItem(TOKEN_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as SessionTokens;
    if (!parsed.accessToken || !parsed.refreshToken) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const getTokens = (): SessionTokens | null => {
  if (!memoryTokens) {
    memoryTokens = readTokensFromStorage();
  }

  return memoryTokens;
};

export const setTokens = (tokens: SessionTokens): void => {
  memoryTokens = tokens;
  if (isBrowser) {
    window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  }
};

export const clearTokens = (): void => {
  memoryTokens = null;
  if (isBrowser) {
    window.localStorage.removeItem(TOKEN_KEY);
  }
};

