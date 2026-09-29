import { migrate as migrateNeon } from 'drizzle-orm/neon-serverless/migrator';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import type { PgliteDatabase } from 'drizzle-orm/pglite';

import { closeDb, createDb, type Schema } from '../db';
import { migrationsFolder } from '../testing';

const started = Date.now();
const target = process.env.DATABASE_URL ? 'neon' : 'pglite';
const db = createDb();
try {
  if (target === 'neon')
    await migrateNeon(db as unknown as NeonDatabase<Schema>, { migrationsFolder });
  else await migratePglite(db as unknown as PgliteDatabase<Schema>, { migrationsFolder });
  console.log(
    JSON.stringify({ event: 'db.migrate', target, durationMs: Date.now() - started, status: 'ok' }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'db.migrate',
      target,
      durationMs: Date.now() - started,
      status: 'error',
      error: String(error),
    }),
  );
  process.exitCode = 1;
} finally {
  await closeDb(db);
}
