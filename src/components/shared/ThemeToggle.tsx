"use client";

import { useState, useEffect } from "react";
import type { Theme } from "@/hooks/useTheme";

interface ThemeToggleProps {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const [icon, setIcon] = useState("🌙");

  useEffect(() => {
    setIcon(theme === "dark" ? "☀️" : "🌙");
  }, [theme]);

  return (
    <button
      onClick={onToggle}
      className="w-9 h-9 rounded-[10px] bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-2)] flex items-center justify-center text-base cursor-pointer transition-all hover:bg-[var(--surface-3)] hover:scale-105"
      aria-label="Toggle visual theme"
    >
      <span className="inline-block transition-transform duration-400">
        {icon}
      </span>
    </button>
  );
}
