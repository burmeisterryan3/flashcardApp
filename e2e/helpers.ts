import { expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

export const PIN = '2580';

export async function typePin(page: Page, pin = PIN) {
  for (const d of pin) await page.keyboard.press(d);
}

/** WF-01: complete first-launch setup with the given children (grade 3 default). */
export async function setup(page: Page, names = ['Sam']) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  await expect(page.getByRole('heading', { name: 'Create a parent PIN' })).toBeVisible();
  await typePin(page);
  await expect(page.getByRole('heading', { name: 'Enter the PIN again' })).toBeVisible();
  await typePin(page);
  for (const [i, n] of names.entries()) {
    if (i > 0) await page.getByRole('button', { name: 'Add another child' }).click();
    await page.getByLabel('First name or nickname').fill(n);
    await page.getByRole('button', { name: 'Save' }).click();
  }
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: /Finish/ }).click();
  // Setup saves decks, then marks itself finished — wait for the next screen.
  await expect(page.getByRole('button', { name: /Today's Practice/ }).or(page.getByRole('heading', { name: "Who's practicing?" }))).toBeVisible({ timeout: 20_000 });
}

export async function openParent(page: Page) {
  await page.getByRole('button', { name: 'Grown-ups area' }).click();
  await expect(page.getByText('Enter your parent PIN')).toBeVisible();
  await typePin(page);
  await expect(page.getByRole('tab', { name: 'Progress' })).toBeVisible();
}

/** Answer whatever card is showing (deliberately wrong), then move on. Returns false when done. */
export async function answerWrong(page: Page): Promise<boolean> {
  // Correct answers auto-advance after ~1s; wait for that before answering again.
  await page.locator('.flashcard.state-correct').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  if (await page.getByRole('button', { name: 'All done' }).isVisible().catch(() => false)) return false;
  const text = page.locator('input.answer-input');
  if (await text.isVisible().catch(() => false)) {
    await text.fill('zzz');
    await page.keyboard.press('Enter');
  } else if (await page.getByRole('button', { name: 'Flip the card' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Flip the card' }).click();
    await page.getByRole('button', { name: 'Not yet' }).click();
    return true;
  } else if (await page.locator('.compare-btns').isVisible().catch(() => false)) {
    await page.locator('.compare-btns button').first().click();
  } else if (await page.locator('.choices').isVisible().catch(() => false)) {
    await page.keyboard.press('1');
  } else {
    await page.keyboard.press('9');
    await page.keyboard.press('9');
    await page.keyboard.press('Enter');
  }
  // Fraction "almost" retry, spelling copy step, then Got it.
  await page.waitForTimeout(300);
  if (await page.locator('.flashcard').getByText(/Almost! Can you|Right amount/).isVisible().catch(() => false)) {
    await page.keyboard.press('9');
    await page.keyboard.press('Enter');
  }
  const copy = page.getByLabel('Type the word correctly');
  if (await copy.isVisible().catch(() => false)) {
    const word = (await page.locator('.diff').last().innerText()).replace(/\s/g, '');
    await copy.fill(word);
    await page.keyboard.press('Enter');
  }
  const got = page.getByRole('button', { name: 'Got it' });
  if (await got.isVisible().catch(() => false)) await got.click();
  await page.waitForTimeout(250);
  return true;
}

export async function expectAccessible(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const summary = results.violations.map((v) => `${v.id}: ${v.nodes.length} × ${v.help} → ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
  expect(summary, `axe violations on ${label}`).toEqual([]);
}
