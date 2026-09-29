import { createDb, type Db } from '@dailyx/db';

import { env } from './env';

const cache = globalThis as { vectorDb?: Db };

export function getDb(): Db {
  cache.vectorDb ??= createDb({ DATABASE_URL: env.DATABASE_URL, PGLITE_DIR: env.PGLITE_DIR });
  return cache.vectorDb;
}
