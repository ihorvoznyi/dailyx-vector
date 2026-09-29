import { expect, test } from '@playwright/test';

import { checkWidths } from './helpers';

test('the setup form shows channels and hours, and accounts already set up', async ({ page }) => {
  await page.goto('/setup');
  await expect(page.getByRole('heading', { name: 'Channels and hours' })).toBeVisible();
  await expect(page.getByText('Accounts are set up.')).toBeVisible();

  const upwork = page.getByRole('button', { name: /^Upwork/ });
  await expect(upwork).toHaveAttribute('aria-pressed', 'true');
});

test('changing hours on a picked channel persists after save and revisit', async ({ page }) => {
  await page.goto('/setup');

  const upwork = page.getByRole('button', { name: /^Upwork/ });
  const tile = upwork.locator('xpath=..');
  await tile.getByRole('button', { name: 'More hours' }).click();
  await expect(tile.getByText('9h/wk')).toBeVisible();

  await page.getByRole('button', { name: 'Save setup' }).click();
  await expect(page).toHaveURL('/');

  await page.goto('/setup');
  const revisited = page.getByRole('button', { name: /^Upwork/ }).locator('xpath=..');
  await expect(revisited.getByText('9h/wk')).toBeVisible();

  await revisited.getByRole('button', { name: 'Fewer hours' }).click();
  await expect(revisited.getByText('8h/wk')).toBeVisible();
  await page.getByRole('button', { name: 'Save setup' }).click();
  await expect(page).toHaveURL('/');
});

test('has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/setup');
});
