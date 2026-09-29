import { expect, type Page } from '@playwright/test';

export const WIDTHS = [390, 768, 1280] as const;

/** Fails when the page scrolls horizontally. */
export async function expectNoHorizontalScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
}

/** Visits `path` at 390, 768 and 1280 px wide and checks for horizontal scroll at each. */
export async function checkWidths(page: Page, path: string): Promise<void> {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(path);
    await expectNoHorizontalScroll(page);
  }
}

/** Reads a value from a `ShowMath` aria-label: 'Show the math: Net worth $48,218.09' → '$48,218.09'. */
export async function mathValue(page: Page, title: string): Promise<string> {
  const button = page.getByRole('button', { name: new RegExp(`^Show the math: ${title} `) });
  const label = await button.getAttribute('aria-label');
  if (!label) throw new Error(`no ShowMath button found for "${title}"`);
  return label.replace(`Show the math: ${title} `, '');
}
