// Export / import / delete-all (WF-12, PR-04). Single versioned JSON file; media as base64.
import { db, type Media } from '../db/db';

export const SCHEMA_VERSION = 1;

const TABLES = ['children', 'decks', 'cards', 'progress', 'attempts', 'sessions', 'rewards', 'settings'] as const;

async function blobToBase64(b: Blob): Promise<string> {
  const bytes = new Uint8Array(await b.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${b.type || 'application/octet-stream'};base64,${btoa(bin)}`;
}

async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const [head, body] = dataUrl.split(',');
  const type = head.match(/data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const bin = atob(body);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

export async function exportAll(): Promise<string> {
  const out: Record<string, unknown> = { schemaVersion: SCHEMA_VERSION, app: 'hoot-flashcards', exportedAt: new Date().toISOString() };
  for (const t of TABLES) out[t] = await db.table(t).toArray();
  const media = await db.media.toArray();
  out.media = await Promise.all(media.map(async (m) => ({ id: m.id, kind: m.kind, data: await blobToBase64(m.blob) })));
  return JSON.stringify(out);
}

export async function importAll(json: string) {
  const data = JSON.parse(json);
  if (data?.app !== 'hoot-flashcards' || typeof data.schemaVersion !== 'number') {
    throw new Error("This file isn't a Hoot Flash Cards backup.");
  }
  if (data.schemaVersion > SCHEMA_VERSION) throw new Error('This backup is from a newer version of the app.');
  const media: Media[] = await Promise.all(
    (data.media ?? []).map(async (m: { id: string; kind: Media['kind']; data: string }) => ({
      id: m.id,
      kind: m.kind,
      blob: await base64ToBlob(m.data),
    })),
  );
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.media], async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      if (Array.isArray(data[t])) await db.table(t).bulkPut(data[t]);
    }
    await db.media.clear();
    await db.media.bulkPut(media);
  });
}

export async function deleteAll() {
  await db.transaction('rw', [...TABLES.map((t) => db.table(t)), db.media], async () => {
    for (const t of TABLES) await db.table(t).clear();
    await db.media.clear();
  });
}

export function downloadText(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
