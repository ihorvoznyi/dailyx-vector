import { createHash } from 'node:crypto';
import { join } from 'node:path';

import { defineConfig, devices } from '@playwright/test';

// One port per checkout, so parallel worktrees never test each other's server.
const hash = createHash('sha1')
  .update(import.meta.dirname)
  .digest();
const port = 20000 + (hash.readUInt16BE(0) % 20000);
const refs = process.env.VECTOR_REFS === '1';

const e2eDb = join(import.meta.dirname, '..', '..', '.data', 'e2e-pglite');
const baseURL = `http://localhost:${port}`;
const appEnv = {
  PGLITE_DIR: e2eDb,
  DATABASE_URL: '', // never Neon, even if .env.local sets it (Next doesn't override an existing env key)
  APP_ENV: '', // seed refuses when set; env.ts treats '' as unset
  ALLOWED_EMAIL: 'owner@example.com',
  BETTER_AUTH_SECRET: 'e2e-secret-e2e-secret-e2e-secret-0123',
  BETTER_AUTH_URL: baseURL,
  GOOGLE_CLIENT_ID: '',
  GOOGLE_CLIENT_SECRET: '',
};

export default defineConfig({
  testDir: './e2e',
  snapshotPathTemplate: '{testDir}/../../../packages/ui/visual/refs/{arg}{ext}',
  fullyParallel: true,
  // Goldens are written only by the refs project; parity runs can never update them.
  updateSnapshots: refs ? 'all' : 'none',
  reporter: 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: `http://localhost:${port}`,
    deviceScaleFactor: 1,
    contextOptions: { reducedMotion: 'reduce' },
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.001,
      threshold: 0.2,
      animations: 'disabled',
      caret: 'hide',
    },
  },
  projects: refs
    ? [{ name: 'refs', testMatch: 'visual/refs.spec.ts' }]
    : [
        { name: 'ui', testMatch: 'visual/components/*.spec.ts' },
        {
          name: 'app',
          testMatch: 'app/**/*.spec.ts',
          fullyParallel: false,
          workers: 1,
          use: { storageState: 'e2e/app/.auth/owner.json' },
        },
      ],
  webServer: refs
    ? undefined
    : {
        command: `tsx e2e/app/prepare.ts && next build && next start --port ${port}`,
        url: `http://localhost:${port}/dev/ui`,
        reuseExistingServer: false,
        timeout: 240_000,
        env: appEnv,
      },
});
