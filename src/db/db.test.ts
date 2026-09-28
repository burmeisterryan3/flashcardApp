// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { childDecks, db, deleteDeck, putMedia, saveDeck, seedBuiltins } from './db';
import { deleteAll, exportAll, importAll } from '../lib/backup';
import { hashPin, newSalt, scrambledDigits, verifyPin } from '../lib/pin';
import type { Card, Deck } from '../engine/types';

const deck = (over: Partial<Deck> = {}): Deck => ({
  id: 'd1',
  subjectId: 'spelling',
  name: 'Week 1',
  type: 'spelling',
  modesAllowed: ['spell'],
  defaultMode: 'spell',
  isBuiltIn: false,
  archived: false,
  assignedChildIds: ['k1'],
  order: 0,
  createdAt: 0,
  updatedAt: 0,
  ...over,
});
const card = (id: string): Card => ({ id: `d1|${id}`, deckId: 'd1', kind: 'spell', prompt: {}, answer: id, alternates: [], tags: [] });

beforeEach(async () => {
  await deleteAll();
});

describe('storage', () => {
  it('seeds built-ins idempotently and keeps parent choices', async () => {
    await seedBuiltins({ 'spell-s3': ['k1'] });
    const n = await db.cards.count();
    await db.decks.update('builtin:spell-s3', { archived: true, testDate: '2026-10-02' });
    await seedBuiltins({});
    expect(await db.cards.count()).toBe(n);
    const d = await db.decks.get('builtin:spell-s3');
    expect(d).toMatchObject({ archived: true, testDate: '2026-10-02', assignedChildIds: ['k1'] });
  });

  it('editing a deck keeps progress for unchanged cards (WF-08)', async () => {
    await saveDeck(deck(), [card('cat'), card('dog')]);
    await db.progress.bulkPut([
      { key: 'k1|d1|cat', childId: 'k1', cardId: 'd1|cat', deckId: 'd1', box: 3, dueAt: 0, timesSeen: 3, timesCorrect: 3, lastSeenAt: 0, mastered: false, focus: false },
      { key: 'k1|d1|dog', childId: 'k1', cardId: 'd1|dog', deckId: 'd1', box: 2, dueAt: 0, timesSeen: 1, timesCorrect: 1, lastSeenAt: 0, mastered: false, focus: false },
    ]);
    await saveDeck(deck(), [card('cat'), card('fox')]);
    expect((await db.progress.get('k1|d1|cat'))?.box).toBe(3);
    expect(await db.progress.get('k1|d1|dog')).toBeUndefined();
  });

  it('children only see assigned, active, non-empty decks', async () => {
    await saveDeck(deck(), [card('cat')]);
    await saveDeck(deck({ id: 'd2', archived: true }), []);
    await saveDeck(deck({ id: 'd3' }), []);
    const { decks } = await childDecks('k1');
    expect(decks.map((d) => d.id)).toEqual(['d1']);
  });

  it('deleteDeck removes cards and history', async () => {
    await saveDeck(deck(), [card('cat')]);
    await db.attempts.add({ childId: 'k1', cardId: 'd1|cat', deckId: 'd1', sessionId: 's', timestamp: 1, mode: 'spell', answerGiven: 'cat', correct: true, usedHint: false, attemptNo: 1, responseMs: 10 });
    await deleteDeck('d1');
    expect(await db.cards.count()).toBe(0);
    expect(await db.attempts.count()).toBe(0);
  });

  it('export → delete → import round-trips, including media', async () => {
    await saveDeck(deck(), [card('cat')]);
    const mid = await putMedia(new Blob(['hello'], { type: 'audio/webm' }), 'audio');
    const json = await exportAll();
    expect(JSON.parse(json).schemaVersion).toBe(1);
    await deleteAll();
    expect(await db.decks.count()).toBe(0);
    await importAll(json);
    expect(await db.decks.count()).toBe(1);
    const m = await db.media.get(mid);
    expect(m?.blob.size).toBe(5);
  });

  it('rejects files that are not backups', async () => {
    await expect(importAll('{"hello":1}')).rejects.toThrow(/backup/);
  });
});

describe('PIN', () => {
  it('hashes with salt and verifies', async () => {
    const salt = newSalt();
    const h = await hashPin('1234', salt);
    expect(h).not.toContain('1234');
    expect(await verifyPin('1234', salt, h)).toBe(true);
    expect(await verifyPin('4321', salt, h)).toBe(false);
  });
  it('scrambled keypad has all ten digits', () => {
    expect([...scrambledDigits()].sort()).toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
  });
});
