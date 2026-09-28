import { expect, test } from '@playwright/test';
import { answerWrong, expectAccessible, openParent, setup, typePin } from './helpers';

test('WF-01 first launch: PIN, two children, grade-3 decks @phone', async ({ page }) => {
  await page.goto('/');
  await expectAccessible(page, 'welcome');
  await setup(page, ['Sam', 'Lee']);
  await expect(page.getByRole('heading', { name: "Who's practicing?" })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sam' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lee' })).toBeVisible();
  await expectAccessible(page, 'profile picker');
  await page.getByRole('button', { name: 'Sam' }).click();
  // Grade 3 → fractions subject is there (D-03 + new fractions topic)
  await expect(page.getByRole('button', { name: /Fractions/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Spelling/ })).toBeVisible();
  await expectAccessible(page, 'home');
});

test('WF-02/03/04 Today’s Practice: two taps, requeue, summary, progress saved', async ({ page }) => {
  await setup(page, ['Sam']);
  // One child → app opens straight to Home; Today's Practice is one tap (PO-01).
  await page.getByRole('button', { name: /Today's Practice/ }).click();
  await expect(page.getByRole('progressbar')).toBeVisible();
  await expectAccessible(page, 'practice card');
  const total = Number((await page.getByRole('progressbar').getAttribute('aria-valuemax')) ?? 0);
  expect(total).toBeGreaterThan(0);
  // Miss the first card: amber feedback, answer shown, Got it required (no auto-advance).
  await answerWrongWithoutAdvancing(page);
  await expect(page.locator('.flashcard.state-wrong')).toBeVisible();
  await expectAccessible(page, 'try-again feedback');
  await page.getByRole('button', { name: 'Got it' }).click();
  // Missed card was requeued → queue grew.
  const after = Number(await page.getByRole('progressbar').getAttribute('aria-valuemax'));
  expect(after).toBeGreaterThan(total);
  // Finish the session.
  for (let i = 0; i < 60 && (await answerWrong(page)); i++);
  await expect(page.getByRole('heading', { name: /You did it!|Nice practicing!/ })).toBeVisible();
  await expectAccessible(page, 'summary');
  await page.getByRole('button', { name: 'All done' }).click();
  await expect(page.getByText(/of 15 cards today|Goal done/)).toBeVisible();
  // Trouble cards show up for the parent with the child's actual answers (WF-09).
  await openParent(page);
  await expect(page.getByRole('heading', { name: 'Trouble cards (last 14 days)' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Add to focus/ }).first()).toBeVisible();
  await expectAccessible(page, 'parent progress');
});

async function answerWrongWithoutAdvancing(page: import('@playwright/test').Page) {
  const text = page.locator('input.answer-input');
  if (await text.isVisible().catch(() => false)) {
    await text.fill('zzz');
    await page.keyboard.press('Enter');
  } else if (await page.locator('.compare-btns').isVisible().catch(() => false)) {
    // pick a sign; try all until one is wrong
    await page.locator('.compare-btns button').first().click();
  } else if (await page.locator('.choices').isVisible().catch(() => false)) {
    await page.keyboard.press('1');
  } else if (await page.getByRole('button', { name: 'Flip the card' }).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: 'Flip the card' }).click();
    await page.getByRole('button', { name: 'I got it' }).click();
    return;
  } else {
    for (const k of ['9', '9', '9', 'Enter']) await page.keyboard.press(k);
  }
  await page.waitForTimeout(300);
  if (await page.locator('.flashcard').getByText(/Almost! Can you|Right amount/).isVisible().catch(() => false)) {
    for (const k of ['9', '9', 'Enter']) await page.keyboard.press(k);
  }
  const copy = page.getByLabel('Type the word correctly');
  if (await copy.isVisible().catch(() => false)) {
    const word = (await page.locator('.diff').last().innerText()).replace(/\s/g, '');
    await copy.fill(word);
    await page.keyboard.press('Enter');
  }
}

test('WF-05 parent adds a 15-word spelling list; child practices Hear & Spell', async ({ page }) => {
  await setup(page, ['Sam']);
  await openParent(page);
  await page.getByRole('tab', { name: 'Decks' }).click();
  await page.getByRole('button', { name: 'New deck' }).click();
  await page.getByRole('button', { name: /Spelling list/ }).click();
  await expect(page.getByLabel('Deck name')).toHaveValue(/Spelling — Week of/);
  const words = 'about, around, because, before, better, brought, caught, during, enough, friend, heard, minute, people, second, thought';
  await page.getByLabel('Paste or type the words').fill(words + '\nBecause'); // duplicate is dropped
  await page.getByRole('button', { name: 'Add to list' }).click();
  await expect(page.getByRole('heading', { name: '15 words' })).toBeVisible();
  await page.getByLabel('Example sentence for because').fill('We came in because it rained.');
  await expectAccessible(page, 'spelling editor');
  await page.getByRole('button', { name: /Save deck \(15 cards\)/ }).click();
  await expect(page.getByText('15 cards').first()).toBeVisible();

  await page.getByRole('button', { name: 'Back to kids' }).click();
  await page.getByRole('button', { name: /Spelling/ }).click();
  await page.getByRole('button', { name: /Spelling — Week of/ }).click();
  await page.getByRole('button', { name: 'Hear & Spell', exact: true }).click();
  await expect(page.locator('.flashcard').getByText('Spell the word you hear')).toBeVisible();
  // The word itself is never shown before answering (CS-08).
  for (const w of words.split(', ')) await expect(page.locator('.flashcard').getByText(w, { exact: true })).toHaveCount(0);
  // Miss → letter diff → must type it correctly once (CS-05, CS-11).
  await page.getByLabel('Type the word you heard').fill('zzz');
  await page.keyboard.press('Enter');
  await expect(page.getByText('Now type it the right way once:')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0);
  const word = (await page.locator('.diff').last().innerText()).replace(/\s/g, '');
  await page.getByLabel('Type the word correctly').fill(word);
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Got it' }).click();
  await expect(page.locator('.flashcard').getByText('Spell the word you hear')).toBeVisible();
});

test('Parent area: PIN gate, math & fraction decks, settings @phone', async ({ page }) => {
  await setup(page, ['Sam']);
  await page.getByRole('button', { name: 'Grown-ups area' }).click();
  await expect(page.getByText('Enter your parent PIN')).toBeVisible();
  await typePin(page, '1111');
  await expect(page.getByRole('alert')).toContainText("didn't match");
  await typePin(page);
  await page.getByRole('tab', { name: 'Decks' }).click();
  await expectAccessible(page, 'decks tab');
  await page.getByRole('button', { name: 'New deck' }).click();
  await page.getByRole('button', { name: /Math facts/ }).click();
  await page.getByLabel('Deck name').fill('×7 facts');
  await page.getByLabel('Multiplication').check();
  for (const t of ['×2', '×3', '×4', '×5']) await page.getByLabel(t, { exact: true }).uncheck();
  await page.getByLabel('×7', { exact: true }).check();
  await expect(page.getByText('11 cards', { exact: true })).toBeVisible(); // 7×0 … 7×10
  await page.getByRole('button', { name: /Save deck/ }).click();
  await page.getByRole('button', { name: 'New deck' }).click();
  await page.getByRole('button', { name: /Fractions/ }).click();
  await page.getByLabel('Deck name').fill('Mixed numbers');
  await page.getByLabel(/Improper fractions ↔ whole/).check();
  await page.getByLabel(/Mixed → improper/).check();
  await page.getByRole('button', { name: /Save deck/ }).click();
  await expect(page.getByText('Mixed numbers')).toBeVisible();
  await page.getByRole('tab', { name: 'Children' }).click();
  await page.getByText('Practice settings').click();
  await expectAccessible(page, 'children tab');
  await page.getByRole('tab', { name: 'Settings' }).click();
  await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
  await expectAccessible(page, 'settings tab');
});

test('Fractions: stacked display and simplest-form retry', async ({ page }) => {
  await setup(page, ['Sam']);
  await page.getByRole('button', { name: /Fractions/ }).click();
  await page.getByRole('button', { name: /Reduce fractions/ }).click();
  const frac = page.locator('.flashcard .frac').first();
  await expect(frac).toBeVisible();
  const label = (await frac.getAttribute('aria-label')) ?? '';
  // Enter the same (unreduced) fraction → "Almost" retry, not a miss (RF-03).
  const [n] = label.split(' ');
  const d = await frac.locator('span').nth(2).innerText();
  for (const k of [...n, 'Tab', ...d, 'Enter']) await page.keyboard.press(k);
  await expect(page.locator('.flashcard').getByText('Almost! Can you make it even simpler?')).toBeVisible();
  await expect(page.locator('.flashcard.state-wrong')).toHaveCount(0);
  await expectAccessible(page, 'fraction card');
});

test('Works offline after the first load (PO-05) @phone', async ({ page, context }) => {
  await setup(page, ['Sam']);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: /Today's Practice/ })).toBeVisible();
  await page.getByRole('button', { name: /Geography/ }).click();
  await page.getByRole('button', { name: /Name the highlighted state/ }).click();
  await page.getByRole('button', { name: 'Pick the answer', exact: true }).click();
  await expect(page.locator('svg.map path.hl')).toBeVisible();
  await context.setOffline(false);
});
