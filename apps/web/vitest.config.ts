import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["fake-indexeddb/auto"],
    include: ["src/**/*.spec.ts", "src/**/*.spec.tsx"],
    passWithNoTests: true,
  },
});
