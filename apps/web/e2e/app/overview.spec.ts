import { expect, test, type Page } from '@playwright/test';

import { checkWidths, mathValue } from './helpers';

/**
 * Reads a ShowMath aria-label, like `mathValue`, but tolerant of the Overview page showing the
 * same net-worth math on two triggers (the KPI cover and the trend card's "Show the math" action).
 */
async function firstMathValue(page: Page, title: string) {
  const button = page
    .getByRole('button', { name: new RegExp(`^Show the math: ${title} `) })
    .first();
  const label = await button.getAttribute('aria-label');
  if (!label) throw new Error(`no ShowMath button found for "${title}"`);
  return label.replace(`Show the math: ${title} `, '');
}

test('net worth on / equals net worth on /money', async ({ page }) => {
  await page.goto('/');
  const overviewValue = await firstMathValue(page, 'Net worth');
  expect(overviewValue).toBe('$48,218.09');

  await page.goto('/money');
  const moneyValue = await mathValue(page, 'Net worth');
  expect(moneyValue).toBe('$48,218.09');
});

test('the Net worth tile and Payoneer source flag stale', async ({ page }) => {
  await page.goto('/');
  const netWorthTile = page
    .getByRole('button', { name: /^Show the math: Net worth /u })
    .first()
    .locator('xpath=..');
  await expect(netWorthTile.getByText('Stale', { exact: true })).toBeVisible();

  const sources = page.locator('#sources');
  await expect(sources.getByText('Payoneer')).toBeVisible();
  await expect(sources.getByText('Stale', { exact: true })).toBeVisible();
});

test('the Sent this week cover button opens and closes on Escape', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Show the math: Sent this week /u });
  await trigger.first().click();
  await expect(page.getByRole('heading', { name: 'Sent this week' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('keyboard: tabbing to the Net worth cover button opens the dialog with Enter, and Escape returns focus', async ({
  page,
}) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: /^Show the math: Net worth /u }).first();
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/');
});
