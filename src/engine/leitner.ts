// Leitner boxes (05-learning-and-progress.md).
import type { CardProgress } from './types';

export const DAY = 24 * 60 * 60 * 1000;
/** Review interval per box in days. Box 1 = every session (due immediately). */
export const INTERVAL_DAYS: Record<number, number> = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 14 };
export const MASTERED_REVIEW_DAYS = 30;

export type Outcome = 'first-try' | 'with-help' | 'miss';

export function newProgress(childId: string, cardId: string, deckId: string): CardProgress {
  return {
    key: `${childId}|${cardId}`,
    childId,
    cardId,
    deckId,
    box: 1,
    dueAt: 0,
    timesSeen: 0,
    timesCorrect: 0,
    lastSeenAt: 0,
    mastered: false,
    focus: false,
  };
}

/**
 * first-try = correct, no hint, no earlier miss this session → up one box.
 * with-help = correct with hint or after a miss → stay.
 * miss      = incorrect → back to box 1.
 * Mastered once correct (first try) while already in box 5.
 */
export function applyOutcome(p: CardProgress, outcome: Outcome, now: number): CardProgress {
  const next = { ...p, timesSeen: p.timesSeen + 1, lastSeenAt: now };
  if (outcome === 'miss') {
    next.box = 1;
    next.mastered = false;
  } else {
    next.timesCorrect += 1;
    if (outcome === 'first-try') {
      if (p.box === 5) next.mastered = true;
      next.box = Math.min(5, p.box + 1);
    }
  }
  const days = next.mastered ? MASTERED_REVIEW_DAYS : INTERVAL_DAYS[next.box];
  // Day-based: a card due "in 1 day" is due any time tomorrow, not 24h later.
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  next.dueAt = days === 0 ? now : new Date(start.getFullYear(), start.getMonth(), start.getDate() + days).getTime();
  // Card leaves the parent's focus list once it's been answered cleanly.
  if (outcome === 'first-try') next.focus = false;
  return next;
}

export type MasteryLevel = 'learning' | 'getting-there' | 'mastered' | 'new';

export function masteryLevel(p: CardProgress | undefined): MasteryLevel {
  if (!p || p.timesSeen === 0) return 'new';
  if (p.mastered || p.box === 5) return 'mastered';
  if (p.box >= 3) return 'getting-there';
  return 'learning';
}

export function isDue(p: CardProgress | undefined, now: number): boolean {
  return !p || p.timesSeen === 0 || p.dueAt <= now;
}

/** Mastery summary for a set of cards (deck badges, parent view). */
export function deckMastery(cardIds: string[], progress: Map<string, CardProgress>) {
  let mastered = 0;
  let getting = 0;
  let learning = 0;
  let fresh = 0;
  for (const id of cardIds) {
    const lvl = masteryLevel(progress.get(id));
    if (lvl === 'mastered') mastered++;
    else if (lvl === 'getting-there') getting++;
    else if (lvl === 'learning') learning++;
    else fresh++;
  }
  const total = cardIds.length || 1;
  return {
    mastered,
    getting,
    learning,
    fresh,
    pctMastered: Math.round((mastered / total) * 100),
    /** Share of deck in box 3+ — used for test readiness. */
    readiness: Math.round(((mastered + getting) / total) * 100),
  };
}
