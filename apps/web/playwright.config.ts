import { createHash } from 'node:crypto';

import { defineConfig, devices } from '@playwright/test';

// One port per checkout, so parallel worktrees never test each other's server.
const hash = createHash('sha1')
  .update(import.meta.dirname)
  .digest();
const port = 20000 + (hash.readUInt16BE(0) % 20000);
const refs = process.env.VECTOR_REFS === '1';

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
    : [{ name: 'ui', testMatch: 'visual/components/*.spec.ts' }],
  webServer: refs
    ? undefined
    : {
        command: `next build && next start --port ${port}`,
        url: `http://localhost:${port}/dev/ui`,
        reuseExistingServer: false,
        timeout: 240_000,
      },
});
