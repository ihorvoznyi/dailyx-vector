import { fileURLToPath } from 'node:url';

import type { PgliteDatabase } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import { createDb, type Db, type Schema } from './db';

export const migrationsFolder = fileURLToPath(new URL('../migrations', import.meta.url));

/** A fresh in-memory PGlite with every migration applied. One per test file or test. */
export async function createTestDb(): Promise<Db> {
  const db = createDb({ PGLITE_DIR: 'memory://' });
  await migrate(db as unknown as PgliteDatabase<Schema>, { migrationsFolder });
  return db;
}
