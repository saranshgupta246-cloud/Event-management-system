import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";

const TOKEN_KEY = "ems_token";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/auth/me");
      if (res.data?.success) {
        setUser(res.data.data);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrateUser();
  }, [hydrateUser]);

  const login = useCallback(async (credentialsOrUser, tokenOrNothing) => {
    if (tokenOrNothing !== undefined && typeof credentialsOrUser === "object" && credentialsOrUser !== null && !credentialsOrUser.password) {
      const token = tokenOrNothing;
      const userData = credentialsOrUser;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      setUser(userData);
      return userData;
    }
    const res = await api.post("/api/auth/login", credentialsOrUser);
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Login failed");
    }
    const { token, user: userData } = res.data.data;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading: loading,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      refetch: hydrateUser,
    }),
    [user, loading, login, logout, hydrateUser]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      loading: false,
      login: () => {},
      logout: () => {},
      isAuthenticated: false,
      refetch: () => {},
    };
  }
  return ctx;
}
