"use client";

import { useEffect, useState, type ReactElement } from "react";
import { useThemeStore, type ThemeState } from "@/lib/theme-store";

export function ThemeToggle(): ReactElement {
  const theme = useThemeStore((state: ThemeState) => state.theme);
  const toggleTheme = useThemeStore((state: ThemeState) => state.toggleTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.dataset["theme"] = theme;
  }, [theme]);

  if (!mounted) {
    return <div className="fixed top-6 right-6 z-50 h-10 w-10" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-xl glass-card text-foreground/80 hover:text-foreground hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
      aria-label="Toggle visual theme"
      title={theme === "day" ? "Switch to Aura Dark" : "Switch to Aura Light"}
    >
      {theme === "day" ? (
        /* Moon Icon */
        <svg className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      ) : (
        /* Sun Icon */
        <svg className="h-[18px] w-[18px] fill-none stroke-current" strokeWidth="2.2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      )}
    </button>
  );
}
