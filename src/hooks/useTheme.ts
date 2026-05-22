"use client";
import { useState, useEffect, useCallback } from "react";

export type Theme = "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    // Read the actual attribute set by the inline script
    const current =
      (document.documentElement.getAttribute("data-theme") as Theme) ||
      (localStorage.getItem("ray-theme") as Theme) ||
      "light";
    setThemeState(current);
    document.documentElement.setAttribute("data-theme", current);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme;
    const next: Theme = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("ray-theme", next);
    setThemeState(next);
  }, []);

  return { theme, toggleTheme };
}
