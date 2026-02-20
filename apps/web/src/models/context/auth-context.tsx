import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { LoginInput, RegisterInput, UserDto } from "@curriculo/shared";
import {
  clearLocalAuthSession,
  getMeRequest,
  loginRequest,
  registerRequest
} from "../auth";

interface AuthContextValue {
  user: UserDto | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const me = await getMeRequest();
        setUser(me);
      } catch {
        clearLocalAuthSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void bootstrap();
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const response = await loginRequest(input);
    setUser(response.user);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const response = await registerRequest(input);
    setUser(response.user);
  }, []);

  const logout = useCallback(() => {
    clearLocalAuthSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout
    }),
    [login, loading, logout, register, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return context;
};