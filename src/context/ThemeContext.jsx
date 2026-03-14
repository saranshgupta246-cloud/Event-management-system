import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "ems_theme";

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    const value = dark ? "dark" : "light";
    localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new Event("storage"));
  }, [dark]);

  const toggleTheme = () => setDark((p) => !p);

  return (
    <ThemeContext.Provider value={{ dark, setDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  return ctx ?? { dark: false, setDark: () => {}, toggleTheme: () => {} };
}
