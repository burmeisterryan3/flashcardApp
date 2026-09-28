// WF-08 Deck management: assign, test dates, pin/reorder, archive, delete, edit, create.
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Archive, ArrowDown, ArrowUp, Pencil, Pin, PinOff, Plus, Trash2, Undo2 } from 'lucide-react';
import { db, deleteDeck } from '../../db/db';
import { SUBJECTS } from '../../content/catalog';
import type { Deck, DeckType } from '../../engine/types';
import { Confirm, Modal } from '../../ui/common';
import DeckEditor from './DeckEditor';
import { useChildren } from './shared';

const NEW_TYPES: { type: DeckType; label: string; blurb: string }[] = [
  { type: 'spelling', label: 'Spelling list', blurb: 'Paste this week’s words — read aloud for your child to spell.' },
  { type: 'sight', label: 'Sight words', blurb: "Paste your school's sight-word list." },
  { type: 'math', label: 'Math facts', blurb: 'Addition, subtraction, multiplication, division — generated for you.' },
  { type: 'fraction', label: 'Fractions', blurb: 'Compare, reduce, or improper ↔ mixed — generated for you.' },
  { type: 'custom', label: 'Custom deck', blurb: 'Your own questions and answers, photos, or a CSV import.' },
];

export default function DecksTab() {
  const decks = useLiveQuery(() => db.decks.toArray(), []) ?? [];
  const counts = useLiveQuery(async () => {
    const m = new Map<string, number>();
    await db.cards.each((c) => m.set(c.deckId, (m.get(c.deckId) ?? 0) + 1));
    return m;
  }, []);
  const kids = useChildren();
  const [editing, setEditing] = useState<{ deckId?: string; type?: DeckType } | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [deleting, setDeleting] = useState<Deck | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  if (editing) return <DeckEditor deckId={editing.deckId} type={editing.type} onClose={() => setEditing(null)} />;

  const update = (d: Deck, patch: Partial<Deck>) => db.decks.update(d.id, { ...patch, updatedAt: Date.now() });
  const move = async (d: Deck, list: Deck[], dir: -1 | 1) => {
    const i = list.indexOf(d);
    const other = list[i + dir];
    if (!other) return;
    await db.transaction('rw', db.decks, async () => {
      await db.decks.update(d.id, { order: other.order });
      await db.decks.update(other.id, { order: d.order === other.order ? d.order + dir : d.order });
    });
  };

  const active = decks.filter((d) => !d.archived);
  const archived = decks.filter((d) => d.archived);

  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
        <p className="muted" style={{ margin: 0 }}>
          Check a child's name to show a deck to them. Built-in decks can be archived but not deleted.
        </p>
        <button className="btn primary" onClick={() => setChoosing(true)}>
          <Plus aria-hidden /> New deck
        </button>
      </div>

      {SUBJECTS.map((s) => {
        const list = active.filter((d) => d.subjectId === s.id).sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned) || a.order - b.order);
        if (!list.length) return null;
        return (
          <section key={s.id} className="panel">
            <h2 style={{ color: `var(--${s.color})` }}>{s.name}</h2>
            <table className="list">
              <tbody>
                {list.map((d, i) => {
                  const n = counts?.get(d.id) ?? 0;
                  return (
                    <tr key={d.id}>
                      <td style={{ minWidth: 180 }}>
                        <b>{d.name}</b>
                        <div className="muted" style={{ fontSize: '0.85em' }}>
                          {n} cards{d.isBuiltIn ? ' · built-in' : ''}
                        </div>
                        {n === 0 && <div className="warn" style={{ marginTop: 4 }}>This deck is empty, so it's hidden from children.</div>}
                      </td>
                      <td>
                        {kids.map((k) => (
                          <label key={k.id} className="check" style={{ minHeight: 32 }}>
                            <input
                              type="checkbox"
                              checked={d.assignedChildIds.includes(k.id)}
                              onChange={(e) =>
                                update(d, { assignedChildIds: e.target.checked ? [...d.assignedChildIds, k.id] : d.assignedChildIds.filter((x) => x !== k.id) })
                              }
                            />
                            {k.name}
                          </label>
                        ))}
                      </td>
                      <td>
                        <label className="field" style={{ margin: 0 }}>
                          <span className="label" style={{ fontSize: '0.85em' }}>
                            Test date
                          </span>
                          <input type="date" className="input" value={d.testDate ?? ''} onChange={(e) => update(d, { testDate: e.target.value || undefined })} />
                        </label>
                      </td>
                      <td>
                        <div className="row" style={{ gap: 4, flexWrap: 'nowrap' }}>
                          <button className="btn ghost small" aria-label={`Move ${d.name} up`} onClick={() => move(d, list, -1)} disabled={i === 0}>
                            <ArrowUp size={16} aria-hidden />
                          </button>
                          <button className="btn ghost small" aria-label={`Move ${d.name} down`} onClick={() => move(d, list, 1)} disabled={i === list.length - 1}>
                            <ArrowDown size={16} aria-hidden />
                          </button>
                          <button className="btn ghost small" aria-label={d.pinned ? `Unpin ${d.name}` : `Pin ${d.name} to the top`} aria-pressed={!!d.pinned} onClick={() => update(d, { pinned: !d.pinned })}>
                            {d.pinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
                          </button>
                          {!d.isBuiltIn ? (
                            <button className="btn ghost small" aria-label={`Edit ${d.name}`} onClick={() => setEditing({ deckId: d.id })}>
                              <Pencil size={16} aria-hidden />
                            </button>
                          ) : null}
                          <button className="btn ghost small" aria-label={`Archive ${d.name}`} onClick={() => update(d, { archived: true })}>
                            <Archive size={16} aria-hidden />
                          </button>
                          {!d.isBuiltIn && (
                            <button className="btn ghost small" aria-label={`Delete ${d.name}`} onClick={() => setDeleting(d)}>
                              <Trash2 size={16} aria-hidden />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        );
      })}

      {archived.length > 0 && (
        <section className="panel">
          <button className="btn ghost small" aria-expanded={showArchived} onClick={() => setShowArchived((v) => !v)}>
            Archived decks ({archived.length})
          </button>
          {showArchived && (
            <table className="list">
              <tbody>
                {archived.map((d) => (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>
                      <button className="btn ghost small" onClick={() => update(d, { archived: false })}>
                        <Undo2 size={16} aria-hidden /> Restore
                      </button>
                      {!d.isBuiltIn && (
                        <button className="btn ghost small" onClick={() => setDeleting(d)}>
                          <Trash2 size={16} aria-hidden /> Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      {choosing && (
        <Modal title="New deck" onClose={() => setChoosing(false)}>
          <div className="stack-gap">
            {NEW_TYPES.map((t) => (
              <button
                key={t.type}
                className="btn"
                style={{ width: '100%', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left' }}
                onClick={() => {
                  setChoosing(false);
                  setEditing({ type: t.type });
                }}
              >
                {t.label}
                <span className="muted" style={{ fontWeight: 400, fontSize: '0.9em' }}>
                  {t.blurb}
                </span>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {deleting && (
        <Confirm
          title={`Delete “${deleting.name}”?`}
          body="This removes the deck and all practice history for it. Archiving keeps the history instead."
          yes="Delete"
          onNo={() => setDeleting(null)}
          onYes={async () => {
            await deleteDeck(deleting.id);
            setDeleting(null);
          }}
        />
      )}
    </>
  );
}
