import axios from "axios";
import { clearTokens, getTokens, setTokens } from "./token-storage";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:3333";

export const api = axios.create({
  baseURL
});

let refreshingPromise: Promise<string | null> | null = null;

api.interceptors.request.use((config) => {
  const tokens = getTokens();
  if (tokens?.accessToken) {
    config.headers.Authorization = `Bearer ${tokens.accessToken}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean }) | undefined;

    if (!originalRequest || originalRequest._retry || error.response?.status !== 401) {
      throw error;
    }

    const tokens = getTokens();
    if (!tokens?.refreshToken) {
      clearTokens();
      throw error;
    }

    originalRequest._retry = true;

    if (!refreshingPromise) {
      refreshingPromise = axios
        .post(`${baseURL}/auth/refresh`, {
          refreshToken: tokens.refreshToken
        })
        .then((response) => {
          const nextTokens = response.data as { accessToken: string; refreshToken: string };
          setTokens(nextTokens);
          return nextTokens.accessToken;
        })
        .catch(() => {
          clearTokens();
          return null;
        })
        .finally(() => {
          refreshingPromise = null;
        });
    }

    const accessToken = await refreshingPromise;

    if (!accessToken) {
      throw error;
    }

    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    return api.request(originalRequest);
  }
);

