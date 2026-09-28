// S-06 Session summary (WF-04) + Test Day results (CS-07).
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Check, Home, RotateCcw, Star } from 'lucide-react';
import { ChildScreen, useApp } from '../app';
import { db } from '../db/db';
import { STICKERS } from '../engine/rewards';
import { sfx } from '../lib/sfx';
import { Owl } from '../ui/art';

export default function Summary({ sessionId }: { sessionId: string }) {
  const { go } = useApp();
  const session = useLiveQuery(() => db.sessions.get(sessionId), [sessionId]);
  const testCards = useLiveQuery(async () => {
    const ids = Object.keys(session?.testResults ?? {});
    return ids.length ? db.cards.bulkGet(ids) : [];
  }, [session?.id]);
  const deck = useLiveQuery(() => (session?.deckId ? db.decks.get(session.deckId) : undefined), [session?.deckId]);
  const [celebrating, setCelebrating] = useState(true);
  const played = useRef(false);

  useEffect(() => {
    if (!session || played.current) return;
    played.current = true;
    if (session.completed) sfx.celebrate();
    const t = setTimeout(() => setCelebrating(false), 1500);
    return () => clearTimeout(t);
  }, [session]);

  if (!session) return <ChildScreen>{null}</ChildScreen>;
  const stickers = STICKERS.filter((s) => session.newStickers?.includes(s.id));
  const wordy = deck?.type === 'spelling' || deck?.type === 'sight';
  const learned = session.newLearned ?? 0;
  const results = session.testResults ?? {};
  const right = Object.values(results).filter(Boolean).length;

  const again = () =>
    session.kind === 'today' ? go({ name: 'practice', kind: 'today' }) : go({ name: 'practice', kind: 'deck', deckId: session.deckId, mode: session.mode });

  return (
    <ChildScreen>
      <main className="child-main center stack-gap" onClick={() => setCelebrating(false)}>
        <div className={celebrating ? 'celebrate' : ''}>
          <Owl size={140} mood={session.completed ? 'cheer' : 'happy'} label="Hoot the owl cheering" />
        </div>
        <h1>{session.completed ? 'You did it!' : 'Nice practicing!'}</h1>

        <div className="row" style={{ justifyContent: 'center' }}>
          <span className="chip" style={{ fontSize: '1.3em' }}>
            <Star color="var(--star)" fill="var(--star)" aria-hidden /> {session.starsEarned} stars
          </span>
          <span className="chip" style={{ fontSize: '1.3em' }}>
            <Check color="var(--good)" aria-hidden /> {session.cardsDone} cards
          </span>
        </div>
        {learned > 0 && (
          <p style={{ fontSize: '1.2em' }}>
            You learned <b>{learned}</b> new {wordy ? (learned === 1 ? 'word' : 'words') : learned === 1 ? 'card' : 'cards'}!
          </p>
        )}

        {session.kind === 'test' && testCards && (
          <section className="card-surface" style={{ padding: 20, textAlign: 'left', maxWidth: 520, margin: '16px auto' }}>
            <h2 className="center">
              Test Day: {right} of {Object.keys(results).length}
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {testCards.filter(Boolean).map((c) => (
                <li key={c!.id} className="row" style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ flex: 1, fontSize: '1.1em' }}>{c!.answer}</span>
                  {results[c!.id] ? (
                    <span className="badge" style={{ background: 'var(--good-tint)', color: 'var(--good)' }}>
                      <Check size={16} aria-hidden /> Right
                    </span>
                  ) : (
                    <span className="badge">To practice</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {stickers.length > 0 && (
          <section className="stack-gap">
            <h2>New sticker{stickers.length > 1 ? 's' : ''}!</h2>
            <div className="row" style={{ justifyContent: 'center' }}>
              {stickers.map((s) => (
                <div key={s.id} className="card-surface sticker celebrate" style={{ minWidth: 130 }}>
                  <div className="art" aria-hidden>
                    {s.emoji}
                  </div>
                  <b>{s.name}</b>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="row" style={{ justifyContent: 'center', marginTop: 16 }}>
          <button className="btn big" onClick={again}>
            <RotateCcw aria-hidden /> Practice more
          </button>
          <button className="btn primary big" onClick={() => go({ name: 'home' })}>
            <Home aria-hidden /> All done
          </button>
        </div>
      </main>
    </ChildScreen>
  );
}
