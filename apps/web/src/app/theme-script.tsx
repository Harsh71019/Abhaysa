import type { ReactElement } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme-store";

/**
 * Runs before hydration to set data-theme from the persisted zustand store,
 * so the very first paint already matches the user's theme (no flash) and
 * React doesn't see a mismatch versus what the client store rehydrates to.
 */
const script = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(raw){var theme=JSON.parse(raw).state.theme;if(theme==="day"||theme==="night"){document.documentElement.dataset.theme=theme;}}}catch(e){}})();`;

export function ThemeScript(): ReactElement {
  // eslint-disable-next-line react/no-danger
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
