import { expect, test } from '@playwright/test';

import { checkWidths } from './helpers';

test('logging one outreach item from the quick-log dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log outreach' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  await page.getByRole('button', { name: 'Referrals' }).click();
  await page.getByRole('button', { name: 'Log 1 ask' }).click();
  await expect(page.getByText('Logged 1')).toBeVisible();
});

test('pasting a list of leads logs them all', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log outreach' }).click();
  await page.getByRole('button', { name: 'Referrals' }).click();
  await page.getByRole('tab', { name: 'Paste a list' }).click();

  await page
    .getByPlaceholder('Name, company, link — one per line')
    .fill('Ann Lee, Acme, https://acme.io\nBob, Kite\nCara, Orbit');
  await expect(page.getByRole('button', { name: 'Log 3 asks' })).toBeEnabled();
  await page.getByRole('button', { name: 'Log 3 asks' }).click();
  await expect(page.getByText('Logged 3')).toBeVisible();
});

test('Escape closes the quick-log dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Log outreach' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('the trigger opens the dialog from the keyboard', async ({ page }) => {
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Log outreach' });
  await trigger.focus();
  await expect(trigger).toBeFocused();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText('Quick log');
});

test('tapping a stage toggles it, and the reply toggle shows a waiting badge', async ({ page }) => {
  await page.goto('/acquisition/referrals');
  const firstRow = page.getByRole('listitem').first();
  const intros = firstRow.getByRole('button', { name: 'Intros' });

  await expect(intros).toHaveAttribute('aria-pressed', 'false');
  await intros.click();
  await expect(intros).toHaveAttribute('aria-pressed', 'true');
  await intros.click();
  await expect(intros).toHaveAttribute('aria-pressed', 'false');

  await firstRow.getByRole('button', { name: 'Client replied' }).click();
  await expect(firstRow.getByText(/Waiting/)).toBeVisible();
  await firstRow.getByRole('button', { name: 'Answered' }).click();
  await expect(firstRow.getByText(/Waiting/)).toBeHidden();
});

test('the acquisition lens has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/acquisition/referrals');
});
