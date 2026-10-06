import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

/**
 * Creates the throwaway SQLite file the repository tests run against.
 *
 * The tests use a real database rather than a mocked Prisma client because the
 * behaviour under test *is* the query Prisma assembles from filter arguments —
 * mocking it away would leave the filter logic untested. `prisma/test.db` is
 * separate from `prisma/dev.db` (and git-ignored), so a test run can never
 * touch demo data.
 *
 * `db push` rather than `migrate deploy` so a fresh clone can run `npm test`
 * before it has any migration history.
 */
export const TEST_DATABASE_URL = "file:./test.db";

const prismaCli = resolve(process.cwd(), "node_modules/prisma/build/index.js");

function prisma(...args: string[]): void {
  execFileSync(process.execPath, [prismaCli, ...args], {
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
  });
}

export default function setup(): void {
  prisma("db", "push", "--skip-generate", "--force-reset");
}
