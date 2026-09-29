import { expect, test } from '@playwright/test';

import { checkWidths } from './helpers';

test('answering a waiting reply removes it from the count', async ({ page }) => {
  await page.goto('/review');
  const answered = page.getByRole('button', { name: 'Answered' });
  const n = await answered.count();
  expect(n).toBeGreaterThanOrEqual(2);
  await answered.first().click();
  await expect(page.getByRole('button', { name: 'Answered' })).toHaveCount(n - 1);
});

test('confirming hours shows the confirmed badge for every channel', async ({ page }) => {
  await page.goto('/review');
  await page.getByRole('button', { name: 'Confirm hours' }).click();
  await expect(page).toHaveURL(/saved=hours/);
  await expect(page.getByText('Confirmed', { exact: true })).toHaveCount(4);
});

test('updating the Payoneer balance clears it from stale balances', async ({ page }) => {
  await page.goto('/review');
  await expect(page.getByText('Payoneer')).toBeVisible();
  await page.getByLabel('Payoneer balance').fill('1700');
  await page.getByRole('button', { name: 'Update' }).click();

  await expect(page).toHaveURL(/saved=balance/);
  await expect(page.getByText('All balances are fresh')).toBeVisible();
});

test('finishing the review shows the Reviewed badge', async ({ page }) => {
  await page.goto('/review');
  await page.getByRole('button', { name: 'Finish review' }).click();
  await expect(page.getByText('Reviewed', { exact: true })).toBeVisible();
});

test('the weekly review has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/review');
});
