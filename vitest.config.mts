import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" path — Vitest doesn't read tsconfig
      // paths on its own, so this is the one other place that mapping has
      // to be spelled out.
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
