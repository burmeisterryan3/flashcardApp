// IndexedDB storage (TR-04). All data stays on this device (PR-01).
import Dexie, { type Table } from 'dexie';
import type {
  Attempt,
  Card,
  CardProgress,
  ChildProfile,
  Deck,
  ParentSettings,
  Rewards,
  Session,
} from '../engine/types';
import { BUILTINS, builtinDeck, builtinDeckId } from '../content/catalog';
import { newProgress } from '../engine/leitner';

export interface Media {
  id: string;
  blob: Blob;
  kind: 'audio' | 'image';
}

export class HootDB extends Dexie {
  children!: Table<ChildProfile, string>;
  decks!: Table<Deck, string>;
  cards!: Table<Card, string>;
  progress!: Table<CardProgress, string>;
  attempts!: Table<Attempt, number>;
  sessions!: Table<Session, string>;
  rewards!: Table<Rewards, string>;
  settings!: Table<ParentSettings, string>;
  media!: Table<Media, string>;

  constructor(name = 'hoot-flashcards') {
    super(name);
    this.version(1).stores({
      children: 'id',
      decks: 'id, subjectId',
      cards: 'id, deckId',
      progress: 'key, childId, cardId, deckId',
      attempts: '++id, childId, cardId, deckId, sessionId, timestamp, [childId+timestamp]',
      sessions: 'id, childId, startedAt',
      rewards: 'childId',
      settings: 'id',
      media: 'id',
    });
  }
}

export const db = new HootDB();

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const getParent = () => db.settings.get('parent');

/**
 * Insert or refresh built-in decks. Existing decks keep the parent's choices
 * (archived, assignments, test date, pin); cards are regenerated with stable IDs.
 * `assign` maps builtin key → child IDs to add.
 */
export async function seedBuiltins(assign: Record<string, string[]> = {}, now = Date.now()) {
  await db.transaction('rw', db.decks, db.cards, async () => {
    let order = 0;
    for (const def of BUILTINS) {
      const id = builtinDeckId(def.key);
      const existing = await db.decks.get(id);
      const fresh = builtinDeck(def, order++, assign[def.key] ?? [], now);
      const deck = existing
        ? {
            ...fresh,
            archived: existing.archived,
            testDate: existing.testDate,
            pinned: existing.pinned,
            sprintEnabled: existing.sprintEnabled,
            order: existing.order,
            createdAt: existing.createdAt,
            assignedChildIds: [...new Set([...existing.assignedChildIds, ...(assign[def.key] ?? [])])],
          }
        : fresh;
      await db.decks.put(deck);
      const cards = def.build(id);
      const keep = new Set(cards.map((c) => c.id));
      const old = await db.cards.where('deckId').equals(id).primaryKeys();
      await db.cards.bulkDelete(old.filter((k) => !keep.has(k)));
      await db.cards.bulkPut(cards);
    }
  });
}

/**
 * Save a deck and its full card list. Cards whose IDs survive keep their progress (WF-08);
 * progress for removed cards is deleted.
 */
export async function saveDeck(deck: Deck, cards: Card[]) {
  await db.transaction('rw', db.decks, db.cards, db.progress, async () => {
    await db.decks.put({ ...deck, updatedAt: Date.now() });
    const keep = new Set(cards.map((c) => c.id));
    const old = await db.cards.where('deckId').equals(deck.id).primaryKeys();
    const removed = old.filter((k) => !keep.has(k));
    await db.cards.bulkDelete(removed);
    if (removed.length) await db.progress.where('cardId').anyOf(removed).delete();
    await db.cards.bulkPut(cards);
  });
}

/** Delete a deck and all its history (WF-08, requires confirmation in the UI). */
export async function deleteDeck(deckId: string) {
  await db.transaction('rw', [db.decks, db.cards, db.progress, db.attempts, db.media], async () => {
    const cards = await db.cards.where('deckId').equals(deckId).toArray();
    const mediaIds = cards.flatMap((c) => [c.prompt.audioRef, c.prompt.imageRef]).filter((x): x is string => !!x && !x.startsWith('map:'));
    await db.media.bulkDelete(mediaIds);
    await db.cards.where('deckId').equals(deckId).delete();
    await db.progress.where('deckId').equals(deckId).delete();
    await db.attempts.where('deckId').equals(deckId).delete();
    await db.decks.delete(deckId);
  });
}

export async function deleteChild(childId: string) {
  await db.transaction('rw', [db.children, db.progress, db.attempts, db.sessions, db.rewards, db.decks], async () => {
    await db.children.delete(childId);
    await db.progress.where('childId').equals(childId).delete();
    await db.attempts.where('childId').equals(childId).delete();
    await db.sessions.where('childId').equals(childId).delete();
    await db.rewards.delete(childId);
    const decks = await db.decks.toArray();
    await db.decks.bulkPut(
      decks
        .filter((d) => d.assignedChildIds.includes(childId))
        .map((d) => ({ ...d, assignedChildIds: d.assignedChildIds.filter((c) => c !== childId) })),
    );
  });
}

/** Decks a child can see: assigned, not archived, not empty (edge case "Empty deck"). */
export async function childDecks(childId: string): Promise<{ decks: Deck[]; cards: Card[] }> {
  const decks = (await db.decks.toArray()).filter((d) => !d.archived && d.assignedChildIds.includes(childId));
  const cards = await db.cards.where('deckId').anyOf(decks.map((d) => d.id)).toArray();
  const withCards = new Set(cards.map((c) => c.deckId));
  return { decks: decks.filter((d) => withCards.has(d.id)).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.order - b.order), cards };
}

export async function progressMap(childId: string): Promise<Map<string, CardProgress>> {
  const rows = await db.progress.where('childId').equals(childId).toArray();
  return new Map(rows.map((p) => [p.cardId, p]));
}

export async function getProgress(childId: string, card: Card): Promise<CardProgress> {
  return (await db.progress.get(`${childId}|${card.id}`)) ?? newProgress(childId, card.id, card.deckId);
}

export async function setFocus(childId: string, card: Card, focus: boolean) {
  const p = await getProgress(childId, card);
  await db.progress.put({ ...p, focus, dueAt: focus ? 0 : p.dueAt });
}

export async function putMedia(blob: Blob, kind: Media['kind']): Promise<string> {
  const id = `media:${uid()}`;
  await db.media.put({ id, blob, kind });
  return id;
}

/** Minutes and cards practiced on a given local day. */
export async function dayTotals(childId: string, dayStart: number) {
  const end = dayStart + 24 * 3600 * 1000;
  const attempts = await db.attempts.where('[childId+timestamp]').between([childId, dayStart], [childId, end]).toArray();
  const ms = attempts.reduce((s, a) => s + Math.min(a.responseMs, 60_000), 0);
  const cards = new Set(attempts.map((a) => `${a.sessionId}|${a.cardId}`)).size;
  return { minutes: Math.round(ms / 60000), cards, attempts };
}

export function startOfDay(t = Date.now()) {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
