"use client";

import type { Theme } from "@/hooks/useTheme";

interface TopbarProps {
  clock: string;
  theme: Theme;
  onToggleTheme: () => void;
}

export function Topbar({ clock, theme, onToggleTheme }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-mark">R</div>
        <div className="logo-text">
          Ray<span> AI</span>{" "}
          <span className="logo-sub">· Agent Command Centre</span>
        </div>
        <div className="ai-wave">
          <div className="ai-wave-bar" />
          <div className="ai-wave-bar" />
          <div className="ai-wave-bar" />
          <div className="ai-wave-bar" />
          <div className="ai-wave-bar" />
        </div>
      </div>
      <div className="topbar-right">
        <button className="theme-btn" onClick={onToggleTheme} aria-label="Toggle visual theme">
          <span>{theme === "dark" ? "☀️" : "🌙"}</span>
        </button>
        <div className="env-badge">Production</div>
        <div className="status-live">
          <div className="pulse" />
          4 Agents Live
        </div>
        <div className="time-badge">{clock}</div>
      </div>
    </header>
  );
}
