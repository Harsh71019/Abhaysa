"use client";

import { useEffect, type ReactElement } from "react";
import { useThemeStore, type ThemeState } from "@/lib/theme-store";

export function ThemeToggle(): ReactElement {
  const theme = useThemeStore((state: ThemeState) => state.theme);
  const toggleTheme = useThemeStore((state: ThemeState) => state.toggleTheme);

  useEffect(() => {
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="min-h-14 rounded-2xl border border-border bg-surface px-6 font-board text-sm uppercase tracking-wide text-foreground"
    >
      {theme === "day" ? "Switch to Indicator (night)" : "Switch to Platform (day)"}
    </button>
  );
}
