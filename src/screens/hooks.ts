// Live data for child screens.
import { useLiveQuery } from 'dexie-react-hooks';
import { childDecks, dayTotals, db, progressMap, startOfDay } from '../db/db';
import { newRewards } from '../engine/rewards';
import { deckMastery } from '../engine/leitner';
import { daysUntil } from '../engine/session';
import type { Card, CardProgress, Deck, Rewards, Session } from '../engine/types';

export interface ChildData {
  decks: Deck[];
  cards: Card[];
  progress: Map<string, CardProgress>;
  rewards: Rewards;
  today: { minutes: number; cards: number };
  resumable?: Session;
}

export function useChildData(childId: string | null): ChildData | undefined {
  return useLiveQuery(async () => {
    if (!childId) return undefined;
    const [{ decks, cards }, progress, rewards, today, sessions] = await Promise.all([
      childDecks(childId),
      progressMap(childId),
      db.rewards.get(childId),
      dayTotals(childId, startOfDay()),
      db.sessions.where('childId').equals(childId).reverse().sortBy('startedAt'),
    ]);
    const last = sessions[0];
    const resumable =
      last && !last.completed && !last.endedAt && last.queue && last.queue.idx < last.queue.queue.length && Date.now() - last.startedAt < 12 * 3600e3
        ? last
        : undefined;
    return { decks, cards, progress, rewards: rewards ?? newRewards(childId), today, resumable };
  }, [childId]);
}

export function masteryFor(deckId: string, data: ChildData) {
  const ids = data.cards.filter((c) => c.deckId === deckId).map((c) => c.id);
  return { count: ids.length, ...deckMastery(ids, data.progress) };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "Test today!", "Test Friday!", or "Test Oct 14" (S-03). */
export function testLabel(testDate: string | undefined, now = Date.now()): string | null {
  if (!testDate) return null;
  const n = daysUntil(testDate, now);
  if (n < 0) return null;
  if (n === 0) return 'Test today!';
  if (n === 1) return 'Test tomorrow!';
  const [y, m, d] = testDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  if (n < 7) return `Test ${WEEKDAYS[dt.getDay()]}!`;
  return `Test ${dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
}
