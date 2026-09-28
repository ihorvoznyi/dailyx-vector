import { test, type Page } from '@playwright/test';

import { card, type Slug } from './cards';
import { shoot } from './shoot';

/**
 * Declares the parity test for one component: our /dev/ui/<slug> against its Vector golden.
 * `fixme` parks a component that can't reach parity yet; the reason shows in the test title.
 */
export function parity(slug: Slug, { fixme }: { fixme?: string } = {}): void {
  test.beforeEach(() => {
    if (test.info().config.updateSnapshots !== 'none') {
      throw new Error(
        'Goldens are read-only here. Regenerate them with `pnpm --filter @dailyx/web refs`.',
      );
    }
  });
  const title = `${card(slug).name} matches Vector`;
  const body = async ({ page }: { page: Page }) => {
    await shoot(page, slug, async () => {
      await page.goto(`/dev/ui/${slug}`);
    });
  };
  if (fixme) test.fixme(`${title} (fixme: ${fixme})`, body);
  else test(title, body);
}
