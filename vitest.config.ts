import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

/**
 * Vitest runs the domain layer directly, so it needs the same `@/*` alias the
 * app and tsconfig use. Tests stay in the node environment — nothing here
 * touches the DOM.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
