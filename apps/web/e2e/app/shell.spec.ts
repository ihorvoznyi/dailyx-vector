import { expect, test } from '@playwright/test';

import { checkWidths } from './helpers';

test('the shell shows the nav and the outreach action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Overview' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Money' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Acquisition' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Review' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Log outreach' })).toBeVisible();
});

test('clicking Settings navigates and marks the link active', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveAttribute(
    'aria-current',
    'page',
  );
});

test('the shell has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/');
  await checkWidths(page, '/settings');
});

test('the nav is keyboard-reachable from the top of the page', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  // The "Vector" brand link is the first focusable element on the page, ahead of the nav.
  await expect(page.getByRole('link', { name: 'Vector' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Overview' })).toBeFocused();
});
