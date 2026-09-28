// Answer checking (02-content-and-subjects.md, AC-01..05, RF-03, IF-02, FR-02).
import type { Card } from './types';
import { compareFrac, isSimplest, mixedValue, parseMixed } from './fractions';

export type CheckResult =
  | { result: 'correct' }
  /** AC-05: one-character typo, counts as correct with a note. */
  | { result: 'close'; message: string }
  /** RF-03 / IF-02: right value, not simplest — retry without counting a miss. */
  | { result: 'almost'; message: string }
  | { result: 'incorrect'; message?: string };

export interface CheckOptions {
  typoTolerance: boolean;
  caseSensitive?: boolean;
}

export function normalize(s: string, caseSensitive = false): string {
  const t = s.trim().replace(/\s+/g, ' ');
  return caseSensitive ? t : t.toLowerCase();
}

export function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
  return dp[a.length][b.length];
}

/** AC-03: "12" and "12.0" match; words don't. */
export function numbersEqual(a: string, b: string): boolean {
  const re = /^-?\d+(\.\d+)?$/;
  const x = a.trim();
  const y = b.trim();
  if (!re.test(x) || !re.test(y)) return false;
  return Number(x) === Number(y);
}

const SIMPLER = 'Almost! Can you make it even simpler?';

export function checkAnswer(card: Card, given: string, opts: CheckOptions): CheckResult {
  const g = given ?? '';
  if (!g.trim()) return { result: 'incorrect' };

  switch (card.kind) {
    case 'frac-compare':
      return g.trim() === card.answer ? { result: 'correct' } : { result: 'incorrect' };

    case 'frac-reduce':
    case 'frac-to-mixed':
    case 'mixed-to-improper': {
      const got = parseMixed(g);
      const want = parseMixed(card.answer);
      if (!got) {
        return /\/\s*0+\s*$/.test(g)
          ? { result: 'incorrect', message: "The bottom number can't be 0." }
          : { result: 'incorrect' };
      }
      if (!want) return { result: 'incorrect' };
      if (compareFrac(mixedValue(got), mixedValue(want)) !== 0) return { result: 'incorrect' };
      // Right value — now check form.
      if (card.kind === 'frac-reduce') {
        // Whole-number answers: "2", "2/1" both fine (RF-05).
        if (got.w > 0 && got.d > 0) return { result: 'almost', message: SIMPLER };
        if (got.d === 0 || got.d === 1) return { result: 'correct' };
        return isSimplest({ n: got.n, d: got.d })
          ? { result: 'correct' }
          : { result: 'almost', message: SIMPLER };
      }
      if (card.kind === 'frac-to-mixed') {
        if (got.d === 0) return { result: 'correct' }; // whole number
        if (got.n >= got.d) {
          return {
            result: 'almost',
            message: 'Right amount! Now pull out the whole ones.',
          };
        }
        if (got.n === 0) return { result: 'correct' };
        return isSimplest({ n: got.n, d: got.d })
          ? { result: 'correct' }
          : { result: 'almost', message: SIMPLER };
      }
      // mixed-to-improper: want a single fraction, no whole part
      if (got.w > 0 && got.d > 0) {
        return { result: 'almost', message: 'Right amount! Now write it as one fraction.' };
      }
      if (got.d === 0) return { result: 'almost', message: 'Right amount! Now write it as a fraction.' };
      return isSimplest({ n: got.n, d: got.d })
        ? { result: 'correct' }
        : { result: 'almost', message: SIMPLER };
    }

    case 'math':
      return numbersEqual(g, card.answer) ||
        card.alternates.some((a) => normalize(a) === normalize(g))
        ? { result: 'correct' }
        : { result: 'incorrect' };

    case 'spell': {
      // AC-04: exact spelling, case-insensitive (CS-04), no typo tolerance.
      const ok = [card.answer, ...card.alternates].some(
        (a) => normalize(a, opts.caseSensitive) === normalize(g, opts.caseSensitive),
      );
      return ok ? { result: 'correct' } : { result: 'incorrect' };
    }

    default: {
      const accepted = [card.answer, ...card.alternates];
      const cs = opts.caseSensitive;
      if (accepted.some((a) => normalize(a, cs) === normalize(g, cs))) return { result: 'correct' };
      if (accepted.some((a) => numbersEqual(a, g))) return { result: 'correct' };
      // AC-05: one-character typo on non-spelling text answers.
      if (opts.typoTolerance) {
        const close = accepted.find(
          (a) => normalize(a).length >= 4 && levenshtein(normalize(a), normalize(g)) === 1,
        );
        if (close) return { result: 'close', message: `Close! Check your spelling: ${close}` };
      }
      return { result: 'incorrect' };
    }
  }
}

/** CS-05: letter-by-letter comparison for spelling feedback. */
export type DiffCell = { ch: string; status: 'ok' | 'wrong' | 'missing' | 'extra' };

export function letterDiff(given: string, answer: string): { given: DiffCell[]; answer: DiffCell[] } {
  const a = normalize(given);
  const b = normalize(answer);
  // LCS alignment
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const gOut: DiffCell[] = [];
  const aOut: DiffCell[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      gOut.push({ ch: a[i], status: 'ok' });
      aOut.push({ ch: b[j], status: 'ok' });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      gOut.push({ ch: a[i], status: 'extra' });
      i++;
    } else {
      aOut.push({ ch: b[j], status: 'missing' });
      j++;
    }
  }
  while (i < a.length) gOut.push({ ch: a[i++], status: 'extra' });
  while (j < b.length) aOut.push({ ch: b[j++], status: 'missing' });
  return { given: gOut.map((c) => (c.status === 'extra' ? { ...c, status: 'wrong' } : c)), answer: aOut };
}
