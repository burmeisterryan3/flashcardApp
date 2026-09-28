// S-03 Deck list per subject + mode picker (WF-02 alternate path).
import { useState } from 'react';
import { CalendarDays, ChevronLeft, Sprout, TreeDeciduous, Trophy, Leaf } from 'lucide-react';
import { ChildScreen, childSettings, useApp } from '../app';
import { MODE_LABEL, subjectById } from '../content/catalog';
import type { Deck, Mode, SubjectId } from '../engine/types';
import { SubjectIcon } from '../ui/art';
import { Modal } from '../ui/common';
import { masteryFor, testLabel, useChildData } from './hooks';

export function availableModes(deck: Deck, sprintAllowed: boolean): Mode[] {
  return deck.modesAllowed.filter((m) => m !== 'sprint' || (sprintAllowed && deck.sprintEnabled !== false));
}

function MasteryBadge({ pct, all }: { pct: number; all: boolean }) {
  if (all) return <span className="badge" style={{ background: 'var(--good-tint)', color: 'var(--good)' }}><Trophy size={16} aria-hidden /> Mastered!</span>;
  if (pct >= 80) return <span className="badge" style={{ background: 'var(--good-tint)', color: 'var(--good)' }}><TreeDeciduous size={16} aria-hidden /> Strong</span>;
  if (pct >= 34) return <span className="badge" style={{ background: 'var(--good-tint)', color: 'var(--good)' }}><Leaf size={16} aria-hidden /> Growing</span>;
  return <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}><Sprout size={16} aria-hidden /> Just started</span>;
}

export default function DeckList({ subject }: { subject: SubjectId }) {
  const { childId, child, go } = useApp();
  const data = useChildData(childId);
  const [picking, setPicking] = useState<Deck | null>(null);
  const sub = subjectById(subject);
  if (!data) return <ChildScreen>{null}</ChildScreen>;
  const s = childSettings(child);
  const decks = data.decks.filter((d) => d.subjectId === subject);

  const start = (deck: Deck, mode: Mode) =>
    mode === 'sprint' ? go({ name: 'sprint', deckId: deck.id }) : go({ name: 'practice', kind: 'deck', deckId: deck.id, mode });

  return (
    <ChildScreen>
      <div className="topbar">
        <button className="btn ghost" onClick={() => go({ name: 'home' })}>
          <ChevronLeft aria-hidden /> Back
        </button>
        <span style={{ color: `var(--${sub.color})`, display: 'flex' }}>
          <SubjectIcon icon={sub.icon} size={32} />
        </span>
        <h1 style={{ margin: 0, fontSize: '1.4em' }}>{sub.name}</h1>
      </div>
      <main className="child-main">
        <div className="deck-list">
          {decks.map((d) => {
            const m = masteryFor(d.id, data);
            const test = testLabel(d.testDate);
            const modes = availableModes(d, s.sprintAllowed);
            return (
              <button
                key={d.id}
                className="card-surface deck-tile"
                style={{ ['--subject' as string]: `var(--${sub.color})` }}
                onClick={() => (modes.length > 1 ? setPicking(d) : start(d, modes[0]))}
              >
                <div style={{ flex: 1 }} className="stack-gap">
                  <b>{d.name}</b>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="muted">{m.count} cards</span>
                    <MasteryBadge pct={m.readiness} all={m.mastered === m.count && m.count > 0} />
                    {test && (
                      <span className="badge">
                        <CalendarDays size={16} aria-hidden /> {test}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>
      {picking && (
        <Modal title={picking.name} onClose={() => setPicking(null)}>
          <p className="muted">How do you want to practice?</p>
          <div className="stack-gap">
            {availableModes(picking, s.sprintAllowed).map((mode) => (
              <button key={mode} className="btn" style={{ width: '100%' }} onClick={() => start(picking, mode)}>
                {MODE_LABEL[mode]}
              </button>
            ))}
          </div>
        </Modal>
      )}
    </ChildScreen>
  );
}
