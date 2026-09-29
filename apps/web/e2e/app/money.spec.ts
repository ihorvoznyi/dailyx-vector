import { expect, test } from '@playwright/test';

import { checkWidths, mathValue } from './helpers';

test('the Accounts card lists every account and flags Payoneer stale', async ({ page }) => {
  await page.goto('/money');
  const accountsCard = page.locator('#accounts');
  await expect(accountsCard.getByText('IBKR')).toBeVisible();
  await expect(accountsCard.getByText('Monobank')).toBeVisible();
  await expect(accountsCard.getByText('PayPal')).toBeVisible();
  await expect(accountsCard.getByText('Payoneer')).toBeVisible();
  await expect(accountsCard.getByText('Stale', { exact: true })).toBeVisible();
});

test('the net worth math opens and closes on Escape', async ({ page }) => {
  await page.goto('/money');
  expect(await mathValue(page, 'Net worth')).toBe('$48,218.09');

  const trigger = page.getByRole('button', { name: /^Show the math: Net worth /u });
  await trigger.first().click();
  await expect(page.getByRole('heading', { name: 'Net worth' })).toBeVisible();
  await expect(page.getByText('Formula')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('updating Monobank keeps net worth unchanged', async ({ page }) => {
  await page.goto('/money');
  // The row is the innermost div that mentions both Monobank and its Update balance control.
  const monobankRow = page
    .locator('#accounts div')
    .filter({ hasText: 'Monobank' })
    .filter({ hasText: 'Update balance' })
    .last();
  await monobankRow.getByText('Update balance').click();
  await monobankRow.getByLabel('Monobank balance').fill('612400');
  await monobankRow.getByLabel('1 USD = ? UAH').fill('41.3');
  await monobankRow.getByRole('button', { name: 'Update' }).click();

  await expect(page).toHaveURL(/saved=balance/);
  expect(await mathValue(page, 'Net worth')).toBe('$48,218.09');
});

test('adding an income source and a payment shows the net amount', async ({ page }) => {
  await page.goto('/money');
  await page.getByText('Add income source').click();
  const incomeSourceForm = page.locator('details').filter({ hasText: 'Add income source' });
  await incomeSourceForm.getByLabel('Name').fill('E2E Retainer');
  await incomeSourceForm.getByLabel('Kind').selectOption('retainer');
  await incomeSourceForm.getByRole('button', { name: 'Add' }).click();
  await expect(page).toHaveURL(/saved=income-source/);

  await page.getByLabel('Source').selectOption({ label: 'E2E Retainer' });
  await page.getByLabel('Amount').fill('100');
  await page.getByRole('button', { name: 'Add payment' }).click();
  await expect(page).toHaveURL(/saved=payment/);

  await expect(page.getByText('$95.00')).toBeVisible();
});

test('has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/money');
});
