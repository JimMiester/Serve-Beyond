import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    // Vitest's default glob also matches e2e/*.spec.ts — those are
    // Playwright tests (their own test() needs Playwright's runner, not
    // Vitest's) and belong to `npx playwright test` only.
    exclude: ["**/node_modules/**", "e2e/**"],
  },
  resolve: {
    alias: {
      // Mirrors tsconfig.json's "@/*" path — Vitest doesn't read tsconfig
      // paths on its own, so this is the one other place that mapping has
      // to be spelled out.
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
});
