// Session building (05 "Building Today's Practice") and the in-session queue (WF-03).
import type { Card, CardProgress, Deck } from './types';
import { DAY, isDue } from './leitner';

export type Rng = () => number;

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function daysUntil(dateStr: string, now: number): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today.getTime()) / DAY);
}

export interface BuildInput {
  cards: Card[];
  decks: Deck[];
  progress: Map<string, CardProgress>; // by cardId
  now: number;
  size: number;
  maxNew?: number;
  rng?: Rng;
}

const isNewOrBox1 = (p?: CardProgress) => !p || p.timesSeen === 0 || p.box === 1;

/** Today's Practice: focus → upcoming tests → due (low box first) → a few new → review fill. */
export function buildTodaySession(input: BuildInput): string[] {
  const { cards, decks, progress, now, size, rng = Math.random } = input;
  const maxNew = input.maxNew ?? 4;
  const deckById = new Map(decks.map((d) => [d.id, d]));
  const usable = cards.filter((c) => {
    const d = deckById.get(c.deckId);
    return d && !d.archived;
  });
  // ~40% cap on new/box-1 cards; floor of 6 so the first day isn't tiny.
  const hardCap = Math.max(6, Math.ceil(size * 0.4));
  const picked: string[] = [];
  const pickedSet = new Set<string>();
  let hardCount = 0;
  let newCount = 0;

  const take = (c: Card, opts: { ignoreNewLimit?: boolean } = {}) => {
    if (picked.length >= size || pickedSet.has(c.id)) return false;
    const p = progress.get(c.id);
    const isNew = !p || p.timesSeen === 0;
    if (isNewOrBox1(p) && hardCount >= hardCap) return false;
    if (isNew && !opts.ignoreNewLimit && newCount >= maxNew) return false;
    picked.push(c.id);
    pickedSet.add(c.id);
    if (isNewOrBox1(p)) hardCount++;
    if (isNew) newCount++;
    return true;
  };

  const byBoxThenOldest = (a: Card, b: Card) => {
    const pa = progress.get(a.id);
    const pb = progress.get(b.id);
    return (pa?.box ?? 0) - (pb?.box ?? 0) || (pa?.lastSeenAt ?? 0) - (pb?.lastSeenAt ?? 0);
  };

  // 1. Parent-flagged focus cards.
  for (const c of shuffle(usable.filter((c) => progress.get(c.id)?.focus), rng)) take(c, { ignoreNewLimit: true });

  // 2. Decks with a test in the next 5 days; closer test → bigger share.
  const testDecks = decks
    .filter((d) => d.testDate && daysUntil(d.testDate, now) >= 0 && daysUntil(d.testDate, now) <= 5)
    .sort((a, b) => daysUntil(a.testDate!, now) - daysUntil(b.testDate!, now));
  for (const d of testDecks) {
    const share = [0.7, 0.6, 0.5, 0.45, 0.4, 0.35][daysUntil(d.testDate!, now)];
    const quota = Math.ceil(size * share);
    let n = 0;
    const deckCards = usable
      .filter((c) => c.deckId === d.id && !progress.get(c.id)?.mastered)
      .sort(byBoxThenOldest);
    for (const c of deckCards) {
      if (n >= quota) break;
      if (take(c, { ignoreNewLimit: true })) n++;
    }
  }

  // 3. Due cards already seen, lowest box first.
  const due = usable
    .filter((c) => {
      const p = progress.get(c.id);
      return p && p.timesSeen > 0 && isDue(p, now);
    })
    .sort(byBoxThenOldest);
  for (const c of due) take(c);

  // 4. A few new cards, drawn across decks so subjects mix.
  const fresh = interleaveByDeck(
    shuffle(usable.filter((c) => !progress.get(c.id) || progress.get(c.id)!.timesSeen === 0), rng),
  );
  for (const c of fresh) take(c);

  // 5. Fill with review (not yet due), least recently seen, mixing subjects.
  const review = usable
    .filter((c) => {
      const p = progress.get(c.id);
      return p && p.timesSeen > 0 && !pickedSet.has(c.id);
    })
    .sort((a, b) => (progress.get(a.id)!.lastSeenAt || 0) - (progress.get(b.id)!.lastSeenAt || 0));
  for (const c of interleaveByDeck(review)) take(c);

  const byId = new Map(usable.map((c) => [c.id, c]));
  return interleaveByDeck(shuffle(picked, rng).map((id) => byId.get(id)!)).map((c) => c.id);
}

/** Practice a single deck: due first, then new, then the rest. */
export function buildDeckSession(input: BuildInput): string[] {
  const { cards, progress, now, size, rng = Math.random } = input;
  const due = cards.filter((c) => {
    const p = progress.get(c.id);
    return p && p.timesSeen > 0 && isDue(p, now);
  });
  const fresh = cards.filter((c) => !progress.get(c.id) || progress.get(c.id)!.timesSeen === 0);
  const rest = cards.filter((c) => !due.includes(c) && !fresh.includes(c));
  const ordered = [...shuffle(due, rng), ...shuffle(fresh, rng), ...shuffle(rest, rng)];
  return shuffle(ordered.slice(0, size), rng).map((c) => c.id);
}

/** Spread cards so the same deck doesn't repeat back-to-back when avoidable. */
export function interleaveByDeck(cards: Card[]): Card[] {
  const groups = new Map<string, Card[]>();
  for (const c of cards) {
    if (!groups.has(c.deckId)) groups.set(c.deckId, []);
    groups.get(c.deckId)!.push(c);
  }
  const out: Card[] = [];
  let last = '';
  while (out.length < cards.length) {
    const options = [...groups.entries()].filter(([, v]) => v.length).sort((a, b) => b[1].length - a[1].length);
    const pick = options.find(([k]) => k !== last) ?? options[0];
    out.push(pick[1].shift()!);
    last = pick[0];
  }
  return out;
}

// ---------------------------------------------------------------------------
// In-session queue (WF-03 steps 4–5, 05 rules & guardrails)

export interface QueueState {
  queue: string[];
  idx: number;
  /** cardIds missed at least once this session */
  missed: string[];
  /** how many times each card has been requeued */
  requeues: Record<string, number>;
  consecutiveMisses: number;
  /** high-box cards used for "end on a success" and the 3-miss guardrail */
  easyPool: string[];
  lastWasMiss: boolean;
}

export const MAX_REQUEUES = 2;

export function newQueue(cardIds: string[], easyPool: string[]): QueueState {
  return {
    queue: [...cardIds],
    idx: 0,
    missed: [],
    requeues: {},
    consecutiveMisses: 0,
    easyPool: easyPool.filter((id) => !cardIds.includes(id)),
    lastWasMiss: false,
  };
}

export function currentCard(s: QueueState): string | undefined {
  return s.queue[s.idx];
}

export function isFinished(s: QueueState): boolean {
  return s.idx >= s.queue.length;
}

/**
 * Advance after an answer. A miss requeues the card 3–5 cards later (max 2 times);
 * 3 misses in a row slots in an easy card; a session never ends on a miss if an
 * easy card is available.
 */
export function advance(s: QueueState, correct: boolean, rng: Rng = Math.random): QueueState {
  const next: QueueState = {
    ...s,
    queue: [...s.queue],
    missed: [...s.missed],
    requeues: { ...s.requeues },
    easyPool: [...s.easyPool],
  };
  const id = s.queue[s.idx];
  if (!correct) {
    if (!next.missed.includes(id)) next.missed.push(id);
    next.consecutiveMisses += 1;
    const n = next.requeues[id] ?? 0;
    if (n < MAX_REQUEUES) {
      next.requeues[id] = n + 1;
      const gap = 3 + Math.floor(rng() * 3); // 3–5
      const at = Math.min(next.queue.length, s.idx + 1 + gap);
      next.queue.splice(at, 0, id);
    }
    if (next.consecutiveMisses >= 3 && next.easyPool.length) {
      next.queue.splice(s.idx + 1, 0, next.easyPool.shift()!);
      next.consecutiveMisses = 0;
    }
  } else {
    next.consecutiveMisses = 0;
  }
  next.lastWasMiss = !correct;
  next.idx += 1;
  if (next.idx >= next.queue.length && !correct && next.easyPool.length) {
    next.queue.push(next.easyPool.shift()!);
  }
  return next;
}

/** Ends the queue early (time limit) but still lets it finish on a success. */
export function wrapUp(s: QueueState): QueueState {
  const q = s.queue.slice(0, s.idx);
  if (s.lastWasMiss && s.easyPool.length) q.push(s.easyPool[0]);
  return { ...s, queue: q };
}
