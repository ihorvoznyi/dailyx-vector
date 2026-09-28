import { test } from '@playwright/test';

import { cards } from './cards';
import { shoot } from './shoot';
import { openVector } from './vector';

// Goldens: the original Vector bundle rendering each preview. Run by `pnpm --filter @dailyx/web refs`.
for (const { name, slug } of cards) {
  test(`${name} (Vector original)`, async ({ page }) => {
    await shoot(page, slug, () => openVector(page, name));
  });
}
