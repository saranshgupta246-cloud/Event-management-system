import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../api/client";
import { isSuperAdminEmail } from "../config/superAdmin";

const TOKEN_KEY = "ems_token";

function consumeTokenFromUrl() {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (!token) return null;
    localStorage.setItem(TOKEN_KEY, token);
    url.searchParams.delete("token");
    const nextUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, document.title, nextUrl || "/");
    return token;
  } catch {
    return null;
  }
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const hydrateUser = useCallback(async () => {
    consumeTokenFromUrl();
    const token = localStorage.getItem(TOKEN_KEY);
    if (import.meta.env.DEV) {
      console.log(
        "Hydrate - Token from localStorage:",
        token ? "present" : "missing"
      );
    }
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/auth/me");
      if (res.data?.success) {
        const rawUser = res.data.data;
        const isSuper = isSuperAdminEmail(rawUser?.email);
        const normalizedUser = isSuper
          ? {
              ...rawUser,
              role: "admin",
              isSuperAdmin: true,
            }
          : rawUser;
        setUser(normalizedUser);
        if (import.meta.env.DEV) {
          console.log("Hydrate - User set successfully:", normalizedUser);
        }
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
    if (
      tokenOrNothing !== undefined &&
      typeof credentialsOrUser === "object" &&
      credentialsOrUser !== null &&
      !credentialsOrUser.password
    ) {
      const token = tokenOrNothing;
      const rawUser = credentialsOrUser;
      const isSuper = isSuperAdminEmail(rawUser?.email);
      const normalizedUser = isSuper
        ? {
            ...rawUser,
            role: "admin",
            isSuperAdmin: true,
          }
        : rawUser;
      if (token) localStorage.setItem(TOKEN_KEY, token);
      setUser(normalizedUser);
      return normalizedUser;
    }
    const res = await api.post("/api/auth/login", credentialsOrUser);
    if (!res.data?.success) {
      throw new Error(res.data?.message || "Login failed");
    }
    const { token, user: rawUser } = res.data.data;
    const isSuper = isSuperAdminEmail(rawUser?.email);
    const normalizedUser = isSuper
      ? {
          ...rawUser,
          role: "admin",
          isSuperAdmin: true,
        }
      : rawUser;
    if (token) localStorage.setItem(TOKEN_KEY, token);
    setUser(normalizedUser);
    return normalizedUser;
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ems_logout_redirect_home", "1");
      // Keep this flag for a short window so any in-flight requests
      // returning 401 during logout can still redirect to "/".
      window.setTimeout(() => {
        sessionStorage.removeItem("ems_logout_redirect_home");
      }, 10000);
    }
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(userData);
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
      setUser: updateUser,
    }),
    [user, loading, login, logout, hydrateUser, updateUser]
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
      setUser: () => {},
    };
  }
  return ctx;
}
