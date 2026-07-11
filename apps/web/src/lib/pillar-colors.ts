import type { Pillar } from "@local/shared";

/** Modern pillar styling configurations for tags, glows, and card accents */

export const PILLAR_LABELS: Record<Pillar, string> = {
  dsa: "Data Structures & Algos",
  "system-design": "System Design",
  genai: "Generative AI",
  "language-internals": "Language Internals",
  behavioral: "Behavioral",
};

export const PILLAR_TEXT_COLOR: Record<Pillar, string> = {
  dsa: "text-dsa",
  "system-design": "text-sysdesign",
  genai: "text-genai",
  "language-internals": "text-jsts",
  behavioral: "text-behavioral",
};

export const PILLAR_BG_COLOR: Record<Pillar, string> = {
  dsa: "bg-dsa/10",
  "system-design": "bg-sysdesign/10",
  genai: "bg-genai/10",
  "language-internals": "bg-jsts/10",
  behavioral: "bg-behavioral/10",
};

/** Outer border gradient configurations */
export const PILLAR_BORDER_CLASS: Record<Pillar, string> = {
  dsa: "border-dsa/30 focus-within:border-dsa/60",
  "system-design": "border-sysdesign/30 focus-within:border-sysdesign/60",
  genai: "border-genai/30 focus-within:border-genai/60",
  "language-internals": "border-jsts/30 focus-within:border-jsts/60",
  behavioral: "border-behavioral/30 focus-within:border-behavioral/60",
};

/** Glow classes for the top card borders */
export const PILLAR_GLOW_CLASS: Record<Pillar, string> = {
  dsa: "shadow-[0_0_20px_rgba(255,126,71,0.06)]",
  "system-design": "shadow-[0_0_20px_rgba(139,92,246,0.06)]",
  genai: "shadow-[0_0_20px_rgba(6,182,212,0.06)]",
  "language-internals": "shadow-[0_0_20px_rgba(234,179,8,0.06)]",
  behavioral: "shadow-[0_0_20px_rgba(16,185,129,0.06)]",
};
