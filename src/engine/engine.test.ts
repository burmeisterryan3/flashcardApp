import { describe, expect, it } from 'vitest';
import type { Card, CardProgress, Deck } from './types';
import { checkAnswer, letterDiff } from './answer';
import { applyOutcome, newProgress, masteryLevel, DAY } from './leitner';
import { generateFractionCards, generateMathCards } from './generators';
import { parseMixed, simplify, toMixed } from './fractions';
import { blankSentence, buildChoices, parseCardImport, parseSpellingList } from './lists';
import { advance, buildTodaySession, newQueue, wrapUp } from './session';
import { displayStreak, newRewards, recordGoalMet, STICKERS } from './rewards';

const card = (over: Partial<Card>): Card => ({
  id: 'c',
  deckId: 'd',
  kind: 'text',
  prompt: {},
  answer: '',
  alternates: [],
  tags: [],
  ...over,
});
const opts = { typoTolerance: true };
const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
};

describe('answer checking (AC rules)', () => {
  it('AC-01 trims and ignores case', () => {
    expect(checkAnswer(card({ answer: 'Boise' }), '  boise ', opts).result).toBe('correct');
  });
  it('AC-01 honors case-sensitive decks', () => {
    expect(checkAnswer(card({ answer: 'Boise' }), 'boise', { ...opts, caseSensitive: true }).result).not.toBe('correct');
  });
  it('AC-02 accepts alternates', () => {
    expect(checkAnswer(card({ answer: 'Saint Paul', alternates: ['St. Paul'] }), 'st. paul', opts).result).toBe('correct');
  });
  it('AC-03 numbers: 12 == 12.0, words rejected', () => {
    const c = card({ kind: 'math', answer: '12' });
    expect(checkAnswer(c, '12.0', opts).result).toBe('correct');
    expect(checkAnswer(c, 'twelve', opts).result).toBe('incorrect');
  });
  it('AC-04 spelling is exact — no typo tolerance', () => {
    expect(checkAnswer(card({ kind: 'spell', answer: 'because' }), 'becuase', opts).result).toBe('incorrect');
    expect(checkAnswer(card({ kind: 'spell', answer: 'because' }), 'Because ', opts).result).toBe('correct');
  });
  it('AC-05 one-letter typo on text answers is "close", toggleable', () => {
    const c = card({ answer: 'Tallahassee' });
    expect(checkAnswer(c, 'Talahassee', opts).result).toBe('close');
    expect(checkAnswer(c, 'Talahassee', { typoTolerance: false }).result).toBe('incorrect');
  });
  it('blank answers are incorrect', () => {
    expect(checkAnswer(card({ answer: 'x' }), '  ', opts).result).toBe('incorrect');
  });
});

describe('fraction answers (RF, IF, FR)', () => {
  const reduce = card({ kind: 'frac-reduce', answer: '3/4' });
  it('simplest form required; equal-but-not-simplest is "almost"', () => {
    expect(checkAnswer(reduce, '3/4', opts).result).toBe('correct');
    expect(checkAnswer(reduce, '6/8', opts).result).toBe('almost');
    expect(checkAnswer(reduce, '2/4', opts).result).toBe('incorrect');
  });
  it('RF-05 whole-number answers accepted', () => {
    const c = card({ kind: 'frac-reduce', answer: '2' });
    expect(checkAnswer(c, '2', opts).result).toBe('correct');
    expect(checkAnswer(c, '2/1', opts).result).toBe('correct');
  });
  it('IF-01/02 improper → mixed and whole', () => {
    const c = card({ kind: 'frac-to-mixed', answer: '2 1/2' });
    expect(checkAnswer(c, '2 1/2', opts).result).toBe('correct');
    expect(checkAnswer(c, '2 2/4', opts).result).toBe('almost');
    expect(checkAnswer(c, '5/2', opts).result).toBe('almost');
    expect(checkAnswer(card({ kind: 'frac-to-mixed', answer: '3' }), '3', opts).result).toBe('correct');
  });
  it('IF-03 mixed → improper', () => {
    const c = card({ kind: 'mixed-to-improper', answer: '11/4' });
    expect(checkAnswer(c, '11/4', opts).result).toBe('correct');
    expect(checkAnswer(c, '2 3/4', opts).result).toBe('almost');
  });
  it('FR-02 zero denominator is rejected with a message', () => {
    const r = checkAnswer(reduce, '3/0', opts);
    expect(r.result).toBe('incorrect');
    expect('message' in r && r.message).toMatch(/0/);
  });
  it('helpers', () => {
    expect(simplify({ n: 6, d: 8 })).toEqual({ n: 3, d: 4 });
    expect(toMixed({ n: 11, d: 4 })).toEqual({ w: 2, n: 3, d: 4 });
    expect(toMixed({ n: 12, d: 4 })).toEqual({ w: 3, n: 0, d: 0 });
    expect(parseMixed('2 3/4')).toEqual({ w: 2, n: 3, d: 4 });
    expect(parseMixed('x')).toBeNull();
  });
});

describe('letter diff (CS-05)', () => {
  it('marks wrong and missing letters', () => {
    const d = letterDiff('becaus', 'because');
    expect(d.answer.filter((c) => c.status === 'missing').map((c) => c.ch)).toEqual(['e']);
    const d2 = letterDiff('becuase', 'because');
    expect(d2.given.some((c) => c.status === 'wrong')).toBe(true);
  });
});

describe('Leitner boxes', () => {
  const now = new Date(2026, 8, 28, 18, 0).getTime();
  const p = newProgress('k', 'c', 'd');
  it('first-try moves up; due dates are day-based', () => {
    const n = applyOutcome(p, 'first-try', now);
    expect(n.box).toBe(2);
    expect(n.dueAt).toBe(new Date(2026, 8, 29).getTime());
  });
  it('with-help stays; miss resets to 1', () => {
    const b3 = { ...p, box: 3, timesSeen: 3 };
    expect(applyOutcome(b3, 'with-help', now).box).toBe(3);
    expect(applyOutcome(b3, 'miss', now).box).toBe(1);
  });
  it('mastered after first-try in box 5, reviewed ~30 days later', () => {
    const n = applyOutcome({ ...p, box: 5, timesSeen: 5 }, 'first-try', now);
    expect(n.mastered).toBe(true);
    expect(masteryLevel(n)).toBe('mastered');
    expect(n.dueAt - now).toBeGreaterThan(29 * DAY);
  });
});

describe('math generator (CM-02)', () => {
  const cards = generateMathCards('m', { ops: ['add', 'sub', 'mul', 'div'], maxSum: 20, tables: [0, 1, 2, 7], display: 'horizontal' });
  it('no negative answers', () => {
    expect(cards.every((c) => Number(c.answer) >= 0)).toBe(true);
  });
  it('never divides by zero; division is whole-number', () => {
    const div = cards.filter((c) => c.data?.op === 'div');
    expect(div.length).toBeGreaterThan(0);
    expect(div.every((c) => c.data!.b !== 0 && c.data!.a! % c.data!.b! === 0)).toBe(true);
  });
  it('addition facts stay within the max', () => {
    expect(cards.filter((c) => c.data?.op === 'add').every((c) => Number(c.answer) <= 20)).toBe(true);
  });
  it('ids are stable and unique', () => {
    const again = generateMathCards('m', { ops: ['add', 'sub', 'mul', 'div'], maxSum: 20, tables: [0, 1, 2, 7], display: 'horizontal' });
    expect(again.map((c) => c.id)).toEqual(cards.map((c) => c.id));
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });
});

describe('fraction generators', () => {
  it('compare decks include equal pairs and correct answers', () => {
    const cs = generateFractionCards('f', { skill: 'compare', compareLevels: ['same-d', 'same-n', 'unlike'] });
    expect(cs.some((c) => c.answer === '=')).toBe(true);
    for (const c of cs) {
      const { f1, f2 } = c.data!;
      const l = f1!.n * f2!.d;
      const r = f2!.n * f1!.d;
      expect(c.answer).toBe(l < r ? '<' : l > r ? '>' : '=');
    }
  });
  it('reduce cards are always reducible and denominator ≤ 60', () => {
    const cs = generateFractionCards('f', { skill: 'reduce' });
    expect(cs.length).toBeGreaterThan(20);
    for (const c of cs) {
      const f = c.data!.f1!;
      expect(f.d).toBeLessThanOrEqual(60);
      expect(c.answer).not.toBe(`${f.n}/${f.d}`);
    }
  });
  it('improper decks cover whole and mixed results, both directions', () => {
    const cs = generateFractionCards('f', { skill: 'improper', directions: ['to-mixed', 'to-improper'] });
    expect(cs.some((c) => c.kind === 'frac-to-mixed' && !c.answer.includes('/'))).toBe(true);
    expect(cs.some((c) => c.kind === 'frac-to-mixed' && c.answer.includes(' '))).toBe(true);
    expect(cs.some((c) => c.kind === 'mixed-to-improper')).toBe(true);
    expect(cs.every((c) => !/\/0$/.test(c.answer))).toBe(true);
  });
});

describe('list parsing', () => {
  it('CS-01 splits on newlines and commas, trims, dedupes', () => {
    const w = parseSpellingList('because, friend\n  Because\n1. said\n\nwhen | When is lunch?');
    expect(w.map((x) => x.word)).toEqual(['because', 'friend', 'said', 'when']);
    expect(w[3].sentence).toBe('When is lunch?');
  });
  it('CC-02 imports CSV with quotes, tabs and header row', () => {
    const rows = parseCardImport('prompt,answer,hint\n"Capital, France",Paris,Starts with P\nH2O\twater');
    expect(rows).toEqual([
      { prompt: 'Capital, France', answer: 'Paris', hint: 'Starts with P' },
      { prompt: 'H2O', answer: 'water' },
    ]);
  });
  it('CS-08 blanks the word in the sentence', () => {
    expect(blankSentence('Because it rained, I stayed in because.', 'because')).toBe('_____ it rained, I stayed in _____.');
  });
  it('CG-04 distractors prefer the same region, no duplicates', () => {
    const deck = ['A', 'B', 'C', 'D', 'E', 'F'].map((x, i) =>
      card({ id: x, answer: x, group: i < 4 ? 'west' : 'east' }),
    );
    const ch = buildChoices(deck[0], deck, 4, seeded());
    expect(ch).toHaveLength(4);
    expect(new Set(ch).size).toBe(4);
    expect(ch.sort()).toEqual(['A', 'B', 'C', 'D']);
  });
});

describe('session builder (05)', () => {
  const now = new Date(2026, 8, 28, 12).getTime();
  const deck = (id: string, over: Partial<Deck> = {}): Deck => ({
    id,
    subjectId: 'math',
    name: id,
    type: 'math',
    modesAllowed: ['numpad'],
    defaultMode: 'numpad',
    isBuiltIn: false,
    archived: false,
    assignedChildIds: ['k'],
    order: 0,
    createdAt: 0,
    updatedAt: 0,
    ...over,
  });
  const mk = (deckId: string, n: number) => Array.from({ length: n }, (_, i) => card({ id: `${deckId}${i}`, deckId }));
  const prog = (id: string, over: Partial<CardProgress>): [string, CardProgress] => [
    id,
    { ...newProgress('k', id, id[0]), timesSeen: 2, lastSeenAt: 1, ...over },
  ];

  it('caps new cards for a brand-new child', () => {
    const ids = buildTodaySession({ cards: mk('a', 40), decks: [deck('a')], progress: new Map(), now, size: 15, rng: seeded() });
    expect(ids.length).toBeLessThanOrEqual(6);
    expect(ids.length).toBeGreaterThan(0);
  });
  it('new cards are mixed across subjects', () => {
    const cards = [...mk('a', 20), ...mk('b', 20), ...mk('c', 20)];
    const decks = [deck('a'), deck('b', { subjectId: 'spelling' }), deck('c', { subjectId: 'geography' })];
    const ids = buildTodaySession({ cards, decks, progress: new Map(), now, size: 15, rng: seeded(3) });
    expect(new Set(ids.map((i) => i[0])).size).toBe(3);
  });
  it('focus cards come first; archived decks excluded', () => {
    const progress = new Map([prog('a3', { focus: true, box: 4, dueAt: now + 5 * DAY })]);
    const ids = buildTodaySession({
      cards: [...mk('a', 10), ...mk('b', 10)],
      decks: [deck('a'), deck('b', { archived: true })],
      progress,
      now,
      size: 15,
      rng: seeded(),
    });
    expect(ids).toContain('a3');
    expect(ids.some((i) => i.startsWith('b'))).toBe(false);
  });
  it('prioritizes decks with a test in the next few days', () => {
    const tomorrow = new Date(now + DAY);
    const td = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    const cards = [...mk('a', 20), ...mk('t', 20)];
    const progress = new Map(cards.map((c) => prog(c.id, { box: 3, dueAt: now - 1 })));
    const ids = buildTodaySession({ cards, decks: [deck('a'), deck('t', { testDate: td })], progress, now, size: 10, rng: seeded() });
    expect(ids.filter((i) => i.startsWith('t')).length).toBeGreaterThanOrEqual(6);
  });
  it('never more than ~40% box-1 cards when review exists', () => {
    const cards = mk('a', 30);
    const progress = new Map(cards.map((c, i) => prog(c.id, { box: i < 15 ? 1 : 3, dueAt: now - 1 })));
    const ids = buildTodaySession({ cards, decks: [deck('a')], progress, now, size: 15, rng: seeded() });
    const box1 = ids.filter((id) => progress.get(id)!.box === 1).length;
    expect(ids).toHaveLength(15);
    expect(box1).toBeLessThanOrEqual(6);
  });
  it('no card appears twice in a row', () => {
    const cards = mk('a', 30);
    const progress = new Map(cards.map((c) => prog(c.id, { box: 2, dueAt: now - 1 })));
    const ids = buildTodaySession({ cards, decks: [deck('a')], progress, now, size: 15, rng: seeded() });
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('in-session queue (WF-03)', () => {
  it('requeues a miss 3–5 cards later, at most twice', () => {
    let q = newQueue(['a', 'b', 'c', 'd', 'e', 'f', 'g'], []);
    q = advance(q, false, () => 0); // gap 3
    expect(q.queue.indexOf('a', 1)).toBe(4);
  });
  it('3 misses in a row inserts an easy card', () => {
    let q = newQueue(['a', 'b', 'c', 'd', 'e', 'f'], ['easy']);
    q = advance(q, false, () => 0.99);
    q = advance(q, false, () => 0.99);
    q = advance(q, false, () => 0.99);
    expect(q.queue[q.idx]).toBe('easy');
  });
  it('ends on a success when the last card is missed', () => {
    let q = newQueue(['a'], ['easy']);
    q = advance(q, false);
    q = advance(q, false);
    q = advance(q, false);
    expect(q.queue[q.queue.length - 1]).toBe('easy');
    const fresh = newQueue(['a', 'b', 'c'], ['easy']);
    const w = wrapUp({ ...fresh, idx: 1, lastWasMiss: true });
    expect(w.queue[w.queue.length - 1]).toBe('easy');
  });
});

describe('rewards', () => {
  const at = (d: number) => new Date(2026, 8, d, 17).getTime();
  it('streak grows daily and the weekly freeze covers one missed day', () => {
    let r = newRewards('k');
    r = recordGoalMet(r, at(28)); // Mon
    r = recordGoalMet(r, at(29));
    expect(r.streakDays).toBe(2);
    r = recordGoalMet(r, at(Oct(1))); // skipped Wed → freeze
    expect(r.streakDays).toBe(3);
    expect(r.freezesLeft).toBe(0);
    expect(displayStreak(r, at(Oct(1)))).toBe(3);
  });
  it('streak resets after a long gap', () => {
    let r = recordGoalMet(newRewards('k'), at(1));
    r = recordGoalMet(r, at(10));
    expect(r.streakDays).toBe(1);
  });
  it('has ~40 unique stickers', () => {
    expect(STICKERS.length).toBe(40);
    expect(new Set(STICKERS.map((s) => s.id)).size).toBe(40);
  });
});

function Oct(d: number) {
  return 30 + d; // Date rolls Sep 31+ into October
}
