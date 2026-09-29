import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { closeDb, createDb, type Schema } from '@dailyx/db';
import { migrationsFolder, seed } from '@dailyx/db/testing';
import { betterAuth } from 'better-auth';
import { testUtils } from 'better-auth/plugins';
import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { authOptions } from '../../src/server/auth-options';

/** Fresh seeded PGlite + a signed-in storageState for the `app` Playwright project. */
const dir = process.env.PGLITE_DIR;
const email = process.env.ALLOWED_EMAIL;
if (!dir || !email) throw new Error('prepare.ts needs PGLITE_DIR and ALLOWED_EMAIL');
export const STORAGE_STATE = join(import.meta.dirname, '.auth', 'owner.json');
const started = Date.now();
rmSync(dir, { recursive: true, force: true });
const db = createDb({ PGLITE_DIR: dir });
try {
  await migrate(db as unknown as PgliteDatabase<Schema>, { migrationsFolder });
  const today = new Date().toISOString().slice(0, 10);
  const result = await seed(db, { email, today, appEnv: process.env.APP_ENV || undefined });
  const auth = betterAuth({
    ...authOptions({
      db,
      allowedEmail: email,
      secret: process.env.BETTER_AUTH_SECRET,
      baseURL: process.env.BETTER_AUTH_URL,
    }),
    plugins: [testUtils()],
  });
  const { cookies } = await (await auth.$context).test.login({ userId: result.userId });
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });
  writeFileSync(STORAGE_STATE, JSON.stringify({ cookies, origins: [] }, null, 2));
  console.log(
    JSON.stringify({ event: 'e2e.prepare', durationMs: Date.now() - started, status: 'ok' }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'e2e.prepare',
      durationMs: Date.now() - started,
      status: 'error',
      error: String(error),
    }),
  );
  process.exitCode = 1;
} finally {
  await closeDb(db);
}
