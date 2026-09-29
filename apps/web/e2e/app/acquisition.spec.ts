import { expect, test } from '@playwright/test';

import { checkWidths } from './helpers';

test('the All channels lens shows one funnel card per active bet', async ({ page }) => {
  await page.goto('/acquisition');
  await expect(page.getByText('Upwork · last 90 days')).toBeVisible();
  await expect(page.getByText('Cold email · last 90 days')).toBeVisible();
  await expect(page.getByText('LinkedIn · last 90 days')).toBeVisible();
  await expect(page.getByText('Referrals · last 90 days')).toBeVisible();
});

test('the Upwork tab opens its lens with the four blocks', async ({ page }) => {
  await page.goto('/acquisition');
  await page.getByRole('tab', { name: /^Upwork/ }).click();
  await expect(page).toHaveURL('/acquisition/upwork');
  await expect(page.getByText('Channel health')).toBeVisible();
  await expect(page.getByText('Outreach log')).toBeVisible();
  await expect(page.getByText('Viewed ÷ Proposals sent')).toBeVisible();
});

test('the Viewed step math opens and closes on Escape', async ({ page }) => {
  await page.goto('/acquisition/upwork');
  // The step-math row reads "Viewed: 67%"; the count-math row reads "Viewed: 113" — take the
  // first match, which is the step row (it renders above the counts).
  await page
    .getByRole('button')
    .filter({ hasText: /^Viewed: \d+%/ })
    .click();
  await expect(page.getByRole('heading', { name: 'Proposals sent → Viewed' })).toBeVisible();
  await expect(page.getByText('Formula')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('the Cold email lens has the same four blocks', async ({ page }) => {
  await page.goto('/acquisition/email');
  await expect(page.getByText('Channel health')).toBeVisible();
  await expect(page.getByText('Outreach log')).toBeVisible();
  await expect(page.getByText('Meetings booked ÷ Replied')).toBeVisible();
});

test('tapping Viewed on the first outreach row toggles it', async ({ page }) => {
  await page.goto('/acquisition/upwork');
  const firstRow = page.getByRole('listitem').first();
  // The button's aria-label gains ", <date>" once the stage is reached, so match a prefix.
  const viewed = firstRow.getByRole('button', { name: /^Viewed/ });

  await expect(viewed).toHaveAttribute('aria-pressed', 'false');
  await viewed.click();
  await expect(viewed).toHaveAttribute('aria-pressed', 'true');
  await viewed.click();
  await expect(viewed).toHaveAttribute('aria-pressed', 'false');
});

test('has no horizontal scroll at any width', async ({ page }) => {
  await checkWidths(page, '/acquisition');
  await checkWidths(page, '/acquisition/upwork');
});
