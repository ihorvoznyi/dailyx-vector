import { expect, type Page } from '@playwright/test';

import { card, WIDTH, type Slug } from './cards';

/**
 * Sizes the viewport to the component's card, waits for fonts, then compares the viewport with
 * the committed golden packages/ui/visual/refs/<slug>.png (written by the refs project).
 */
export async function shoot(page: Page, slug: Slug, open: () => Promise<void>): Promise<void> {
  await page.setViewportSize({ width: WIDTH, height: card(slug).height });
  await open();
  await page.evaluate(() => document.fonts.ready);
  await expect(page).toHaveScreenshot(`${slug}.png`);
}
