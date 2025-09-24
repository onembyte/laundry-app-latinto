"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";

type ThemeContext = {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  isDark: boolean;
};

const ThemeCtx = createContext<ThemeContext | null>(null);

function getStoredTheme(): ThemeMode | null {
  if (typeof window === "undefined") return null;
  const t = localStorage.getItem("theme");
  if (t === "light" || t === "dark" || t === "system") return t;
  return null;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(getStoredTheme() ?? "system");
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark());

  // keep system preference up to date
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setSystemDark(mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // apply theme class to document
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === "dark" || (theme === "system" && systemDark);
    root.classList.toggle("dark", dark);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme, systemDark]);

  const value = useMemo<ThemeContext>(
    () => ({ theme, setTheme: setThemeState, isDark: theme === "dark" || (theme === "system" && systemDark) }),
    [theme, systemDark]
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const v = useContext(ThemeCtx);
  if (!v) throw new Error("useTheme must be used within ThemeProvider");
  return v;
}

