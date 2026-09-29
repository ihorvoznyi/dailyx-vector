import { closeDb, createDb } from '../db';
import { seed } from '../seed/seed';

const started = Date.now();
const db = createDb();
try {
  const result = await seed(db, {
    email: process.env.ALLOWED_EMAIL || 'owner@example.com',
    today: new Date().toISOString().slice(0, 10),
    appEnv: process.env.APP_ENV || undefined,
  });
  console.log(
    JSON.stringify({
      event: 'db.seed',
      durationMs: Date.now() - started,
      status: 'ok',
      skipped: result.skipped,
      ...(result.skipped ? {} : { counts: result.counts }),
    }),
  );
} catch (error) {
  console.error(
    JSON.stringify({
      event: 'db.seed',
      durationMs: Date.now() - started,
      status: 'error',
      error: String(error),
    }),
  );
  process.exitCode = 1;
} finally {
  await closeDb(db);
}
