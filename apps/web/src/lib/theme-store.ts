import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "day" | "night";

export const THEME_STORAGE_KEY = "local-theme";

export interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: "day",
      setTheme: (theme) => {
        set({ theme });
      },
      toggleTheme: () => {
        set({ theme: get().theme === "day" ? "night" : "day" });
      },
    }),
    { name: THEME_STORAGE_KEY },
  ),
);
