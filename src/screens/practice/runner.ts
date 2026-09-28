// Session lifecycle: build → record each answer (saved immediately, WF-04 step 4) → finish.
import { childDecks, dayTotals, db, progressMap, startOfDay, uid } from '../../db/db';
import { applyOutcome, newProgress, type Outcome } from '../../engine/leitner';
import { buildDeckSession, buildTodaySession, newQueue, shuffle, type QueueState } from '../../engine/session';
import { newRewards, newlyUnlocked, recordGoalMet } from '../../engine/rewards';
import { DEFAULT_CHILD_SETTINGS, type Card, type Mode, type Session, type SubjectId } from '../../engine/types';

export async function createSession(childId: string, opts: { kind: 'today' | 'deck'; deckId?: string; mode?: Mode }): Promise<Session | null> {
  const child = await db.children.get(childId);
  const s = { ...DEFAULT_CHILD_SETTINGS, ...(child?.settings ?? {}) };
  const { decks, cards } = await childDecks(childId);
  const progress = await progressMap(childId);
  const now = Date.now();
  const isTest = opts.mode === 'spell-test';
  let pool = cards;
  let ids: string[];
  if (opts.kind === 'deck' && opts.deckId) {
    pool = cards.filter((c) => c.deckId === opts.deckId);
    // Test Day covers the whole list, like the Friday test (CS-07).
    ids = isTest ? shuffle(pool).map((c) => c.id) : buildDeckSession({ cards: pool, decks, progress, now, size: s.sessionCards });
  } else {
    ids = buildTodaySession({ cards, decks, progress, now, size: s.sessionCards });
  }
  if (!ids.length) return null;
  const easy = shuffle(pool.filter((c) => (progress.get(c.id)?.box ?? 0) >= 3)).map((c) => c.id);
  const session: Session = {
    id: uid(),
    childId,
    startedAt: now,
    cardsPlanned: ids.length,
    cardsDone: 0,
    starsEarned: 0,
    completed: false,
    kind: isTest ? 'test' : opts.kind,
    deckId: opts.deckId,
    mode: opts.mode,
    queue: newQueue(ids, isTest ? [] : easy.slice(0, 10)),
    newLearned: 0,
    correctCount: 0,
    testResults: isTest ? {} : undefined,
  };
  await db.sessions.put(session);
  return session;
}

export interface AnswerRecord {
  session: Session;
  card: Card;
  mode: Mode;
  answer: string;
  correct: boolean;
  outcome: Outcome;
  usedHint: boolean;
  responseMs: number;
  nextQueue: QueueState;
  /** Sprint answers are logged but don't move boxes (05). */
  skipLeitner?: boolean;
}

export async function recordAnswer(r: AnswerRecord): Promise<Session> {
  const { session, card } = r;
  const now = Date.now();
  let updated = session;
  await db.transaction('rw', db.attempts, db.progress, db.rewards, db.sessions, async () => {
    const attemptNo = (await db.attempts.where('sessionId').equals(session.id).filter((a) => a.cardId === card.id).count()) + 1;
    await db.attempts.add({
      childId: session.childId,
      cardId: card.id,
      deckId: card.deckId,
      sessionId: session.id,
      timestamp: now,
      mode: r.mode,
      answerGiven: r.answer,
      correct: r.correct,
      usedHint: r.usedHint,
      attemptNo,
      responseMs: r.responseMs,
    });
    let learnedNew = false;
    if (!r.skipLeitner) {
      const key = `${session.childId}|${card.id}`;
      const p = (await db.progress.get(key)) ?? newProgress(session.childId, card.id, card.deckId);
      learnedNew = p.timesSeen === 0 && r.outcome === 'first-try';
      await db.progress.put(applyOutcome(p, r.outcome, now));
    }
    if (r.correct) {
      const rw = (await db.rewards.get(session.childId)) ?? newRewards(session.childId);
      await db.rewards.put({ ...rw, stars: rw.stars + 1 });
    }
    updated = {
      ...session,
      cardsDone: session.cardsDone + 1,
      starsEarned: session.starsEarned + (r.correct ? 1 : 0),
      correctCount: (session.correctCount ?? 0) + (r.correct ? 1 : 0),
      newLearned: (session.newLearned ?? 0) + (learnedNew ? 1 : 0),
      queue: r.nextQueue,
      testResults: session.testResults && !(card.id in session.testResults) ? { ...session.testResults, [card.id]: r.correct } : session.testResults,
    };
    await db.sessions.put(updated);
  });
  return updated;
}

/** Wraps up rewards: finish bonus, streak, deck mastery, stickers. */
export async function finishSession(session: Session, completed: boolean): Promise<Session> {
  const childId = session.childId;
  const child = await db.children.get(childId);
  const s = { ...DEFAULT_CHILD_SETTINGS, ...(child?.settings ?? {}) };
  let rw = (await db.rewards.get(childId)) ?? newRewards(childId);
  const now = Date.now();
  const bonus = completed && session.cardsDone > 0 ? 3 : 0;
  rw = { ...rw, stars: rw.stars + bonus, sessionsCompleted: rw.sessionsCompleted + (completed ? 1 : 0) };

  const today = await dayTotals(childId, startOfDay(now));
  if (today.cards >= s.dailyGoalCards) rw = recordGoalMet(rw, now);

  if (session.kind === 'test' && completed && session.testResults && Object.values(session.testResults).every(Boolean)) {
    rw = { ...rw, testsPerfect: rw.testsPerfect + 1 };
  }

  // Deck mastery + sticker stats
  const [decks, allCards, progress, attempts] = await Promise.all([
    db.decks.toArray(),
    db.cards.toArray(),
    progressMap(childId),
    db.attempts.where('childId').equals(childId).toArray(),
  ]);
  const deckSubject = new Map(decks.map((d) => [d.id, d.subjectId]));
  const byDeck = new Map<string, Card[]>();
  for (const c of allCards) byDeck.set(c.deckId, [...(byDeck.get(c.deckId) ?? []), c]);
  const mastered = [...byDeck.entries()]
    .filter(([id, cs]) => decks.find((d) => d.id === id)?.assignedChildIds.includes(childId) && cs.length > 0 && cs.every((c) => progress.get(c.id)?.mastered))
    .map(([id]) => id);
  rw = { ...rw, decksMastered: [...new Set([...rw.decksMastered, ...mastered])] };

  const correctBy = (sub: SubjectId) => attempts.filter((a) => a.correct && deckSubject.get(a.deckId) === sub).length;
  const unlocked = newlyUnlocked({
    rewards: rw,
    masteredCards: [...progress.values()].filter((p) => p.mastered).length,
    subjectsPracticed: [...new Set(attempts.map((a) => deckSubject.get(a.deckId)).filter(Boolean) as string[])],
    spellingCorrect: correctBy('spelling'),
    mathCorrect: correctBy('math'),
    fractionCorrect: correctBy('fractions'),
    geoCorrect: correctBy('geography'),
    readingCorrect: correctBy('reading'),
  });
  rw = { ...rw, stickersUnlocked: [...rw.stickersUnlocked, ...unlocked.map((u) => u.id)] };
  await db.rewards.put(rw);

  const done: Session = {
    ...session,
    completed,
    endedAt: now,
    starsEarned: session.starsEarned + bonus,
    newStickers: unlocked.map((u) => u.id),
  };
  await db.sessions.put(done);
  return done;
}
