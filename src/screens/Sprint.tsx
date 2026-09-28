// Fact Sprint (CM-05, 05 "Timed Fact Sprint"): 60 seconds, beat your own best.
// Wrong answers don't subtract; sprint answers don't move Leitner boxes.
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Home, Pause, RotateCcw, Timer, Trophy, Check } from 'lucide-react';
import { ChildScreen, useApp } from '../app';
import { db, uid } from '../db/db';
import { checkAnswer } from '../engine/answer';
import { OP_SYMBOL } from '../engine/generators';
import { newQueue, shuffle } from '../engine/session';
import { newRewards } from '../engine/rewards';
import type { Card, Session } from '../engine/types';
import { sfx } from '../lib/sfx';
import { Owl } from '../ui/art';
import { FracView, NumberPad } from '../ui/inputs';
import { finishSession, recordAnswer } from './practice/runner';

const SECONDS = 60;

export default function Sprint({ deckId }: { deckId: string }) {
  const { childId, go } = useApp();
  const [cards, setCards] = useState<Card[]>([]);
  const [deckName, setDeckName] = useState('');
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'running' | 'done'>('ready');
  const [left, setLeft] = useState(SECONDS);
  const [order, setOrder] = useState<Card[]>([]);
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const [flash, setFlash] = useState<{ ok: boolean; answer: string } | null>(null);
  const [newBest, setNewBest] = useState(false);
  const session = useRef<Session | null>(null);
  const shown = useRef(Date.now());
  const scoreRef = useRef(0);

  useEffect(() => {
    (async () => {
      const [cs, deck, rw] = await Promise.all([db.cards.where('deckId').equals(deckId).toArray(), db.decks.get(deckId), childId ? db.rewards.get(childId) : undefined]);
      setCards(cs.filter((c) => c.kind === 'math' || c.kind === 'frac-compare'));
      setDeckName(deck?.name ?? '');
      setBest(rw?.sprintBest?.[deckId] ?? 0);
    })();
  }, [deckId, childId]);

  const start = async () => {
    if (!childId || !cards.length) return;
    const ord = shuffle([...cards, ...cards]).slice(0, 200);
    const s: Session = { id: uid(), childId, startedAt: Date.now(), cardsPlanned: 0, cardsDone: 0, starsEarned: 0, completed: false, kind: 'sprint', deckId, queue: newQueue([], []) };
    await db.sessions.put(s);
    session.current = s;
    scoreRef.current = 0;
    setOrder(ord);
    setI(0);
    setScore(0);
    setLeft(SECONDS);
    setNewBest(false);
    setPhase('running');
    shown.current = Date.now();
  };

  // Countdown (only visible timer in the app — AX-09: sprint can be turned off by the parent)
  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running' && left <= 0) end(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, phase]);

  const end = async (completed: boolean) => {
    setPhase('done');
    const s = session.current;
    if (!s || !childId) return;
    const final = scoreRef.current;
    const rw = (await db.rewards.get(childId)) ?? newRewards(childId);
    const prev = rw.sprintBest[deckId] ?? 0;
    if (final > prev) {
      await db.rewards.put({ ...rw, sprintBest: { ...rw.sprintBest, [deckId]: final } });
      setNewBest(prev > 0 || final > 0);
      setBest(final);
    }
    const latest = (await db.sessions.get(s.id)) ?? s;
    await finishSession(latest, completed && latest.cardsDone > 0);
  };

  const answer = async (given: string) => {
    const card = order[i];
    const s = session.current;
    if (!card || !s || flash) return;
    const ok = checkAnswer(card, given, { typoTolerance: false }).result === 'correct';
    if (ok) {
      sfx.correct();
      scoreRef.current += 1;
      setScore(scoreRef.current);
    } else sfx.tryAgain();
    setFlash({ ok, answer: card.answer });
    const latest = (await db.sessions.get(s.id)) ?? s;
    session.current = await recordAnswer({
      session: latest,
      card,
      mode: 'sprint',
      answer: given,
      correct: ok,
      outcome: ok ? 'first-try' : 'miss',
      usedHint: false,
      responseMs: Date.now() - shown.current,
      nextQueue: latest.queue!,
      skipLeitner: true,
    });
    setTimeout(
      () => {
        setFlash(null);
        setI((x) => (x + 1) % order.length);
        shown.current = Date.now();
      },
      ok ? 250 : 900,
    );
  };

  const card = order[i];

  return (
    <ChildScreen>
      <div className="topbar">
        {phase !== 'running' ? (
          <button className="btn ghost" onClick={() => go({ name: 'decks', subject: card?.kind === 'frac-compare' || cards[0]?.kind === 'frac-compare' ? 'fractions' : 'math' })}>
            <ChevronLeft aria-hidden /> Back
          </button>
        ) : (
          <span className="chip" aria-live="off" style={{ fontSize: '1.3em' }}>
            <Timer aria-hidden /> {left}s<span className="sr-only"> left</span>
          </span>
        )}
        <span className="spacer" />
        {phase === 'running' && (
          <>
            <span className="chip" style={{ fontSize: '1.3em' }} aria-live="polite">
              <Check color="var(--good)" aria-hidden /> {score}
            </span>
            <button className="btn ghost icon-btn" aria-label="Stop the sprint" onClick={() => end(false)}>
              <Pause aria-hidden />
            </button>
          </>
        )}
      </div>
      <main className="child-main practice center">
        {phase === 'ready' && (
          <div className="stack-gap">
            <Owl size={120} mood="happy" />
            <h1>Fact Sprint</h1>
            <p>{deckName}</p>
            <p className="muted">Answer as many as you can in 60 seconds. Mistakes don't take points away!</p>
            <p>
              <Trophy color="var(--star)" aria-hidden /> Your best: <b>{best}</b>
            </p>
            <button className="btn primary big" onClick={start} disabled={!cards.length}>
              Start!
            </button>
          </div>
        )}

        {phase === 'running' && card && (
          <>
            <section className={`card-surface flashcard ${flash ? (flash.ok ? 'state-correct' : 'state-wrong') : ''}`} style={{ ['--subject' as string]: 'var(--math)' }}>
              {card.kind === 'math' && card.data?.op ? (
                <div className="prompt">{`${card.data.a} ${OP_SYMBOL[card.data.op]} ${card.data.b} = ?`}</div>
              ) : card.data?.f1 && card.data.f2 ? (
                <div className="prompt row" style={{ justifyContent: 'center', gap: 24 }}>
                  <FracView f={card.data.f1} /> <span aria-hidden>?</span><span className="sr-only">blank</span> <FracView f={card.data.f2} />
                </div>
              ) : null}
              {flash && !flash.ok && (
                <div className="feedback amber" role="status">
                  The answer is {flash.answer}
                </div>
              )}
            </section>
            {card.kind === 'math' ? (
              <NumberPad key={i} onSubmit={answer} disabled={!!flash} />
            ) : (
              <div className="compare-btns">
                {['<', '=', '>'].map((s) => (
                  <button key={s} className="btn" onClick={() => answer(s)} disabled={!!flash} aria-label={s === '<' ? 'is less than' : s === '>' ? 'is greater than' : 'is equal to'}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {phase === 'done' && (
          <div className="stack-gap">
            <Owl size={130} mood="cheer" />
            <h1>
              {score} right in {SECONDS - Math.max(0, left)} seconds!
            </h1>
            {newBest ? <p style={{ fontSize: '1.3em' }}><Trophy color="var(--star)" aria-hidden /> New personal best!</p> : <p className="muted">Your best is {best}. Keep practicing to beat it!</p>}
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn big" onClick={start}>
                <RotateCcw aria-hidden /> Go again
              </button>
              <button className="btn primary big" onClick={() => go({ name: 'home' })}>
                <Home aria-hidden /> All done
              </button>
            </div>
          </div>
        )}
      </main>
    </ChildScreen>
  );
}
