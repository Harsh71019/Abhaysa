import { Archivo, Literata, JetBrains_Mono } from "next/font/google";

/**
 * next/font/google downloads and self-hosts these at build time — the app
 * never makes a runtime request to Google Fonts, satisfying the "zero
 * network requests after first load" rule in FRONTEND_PLAN.md §8 without
 * hand-managing font files.
 */

/** Board/display face — Indicator board, timers, counts, streaks. Width axis lets us hit "SemiExpanded". */
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

/** Reading face — card fronts/backs. Optical size axis tunes it for 17-18px screen reading. */
export const literata = Literata({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-literata",
  display: "swap",
});

/** Code face — shiki-highlighted code-read cards. */
export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});
