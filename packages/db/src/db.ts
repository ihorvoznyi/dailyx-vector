import { existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { Pool } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';

import * as schema from './schema';

export type Schema = typeof schema;
/** Drizzle's shared pg-core database type: PGlite and Neon both satisfy it. */
export type Db = PgDatabase<PgQueryResultHKT, Schema>;

export interface DbEnv {
  /** Neon connection string. Set → Neon (WebSocket Pool). Unset → PGlite. */
  DATABASE_URL?: string | undefined;
  /** PGlite data dir, or `memory://`. Unset → `<repo root>/.data/pglite`. */
  PGLITE_DIR?: string | undefined;
}

export function createDb(
  env: DbEnv = { DATABASE_URL: process.env.DATABASE_URL, PGLITE_DIR: process.env.PGLITE_DIR },
): Db {
  if (env.DATABASE_URL) {
    return drizzleNeon({ client: new Pool({ connectionString: env.DATABASE_URL }), schema });
  }
  const dir = env.PGLITE_DIR ?? join(repoRoot(), '.data', 'pglite');
  if (!dir.startsWith('memory://')) mkdirSync(dir, { recursive: true });
  return drizzlePglite({ client: new PGlite(dir), schema });
}

/** Closes the underlying PGlite instance or Neon pool. Scripts call it before exiting. */
export async function closeDb(db: Db): Promise<void> {
  const client = (
    db as unknown as { $client: { close?: () => Promise<void>; end?: () => Promise<void> } }
  ).$client;
  await (client.close ?? client.end)?.call(client);
}

function repoRoot(): string {
  let dir = process.cwd();
  while (!existsSync(join(dir, 'pnpm-workspace.yaml'))) {
    const up = dirname(dir);
    if (up === dir)
      throw new Error(`No pnpm-workspace.yaml above ${process.cwd()}; set PGLITE_DIR`);
    dir = up;
  }
  return dir;
}
