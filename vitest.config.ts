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
    // Applied before any test file is imported, so the Prisma client
    // constructed inside a test points at prisma/test.db, never dev.db.
    env: {
      DATABASE_URL: "file:./test.db",
    },
    // The schema is pushed to the throwaway database before the suite runs.
    globalSetup: ["test/globalSetup.ts"],
    // SQLite is a single file and every repository test writes fixtures; one
    // file at a time keeps them from locking each other out.
    fileParallelism: false,
  },
});
