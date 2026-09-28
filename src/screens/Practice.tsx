// S-04 / S-05 Practice screen (WF-03, WF-04). One card at a time; mistakes are safe.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Lightbulb, Pause, Snail, Star, Volume2, MessageSquareText, Hand } from 'lucide-react';
import { ChildScreen, childSettings, useApp } from '../app';
import { childDecks, dayTotals, db, startOfDay } from '../db/db';
import { subjectById } from '../content/catalog';
import { checkAnswer, normalize } from '../engine/answer';
import { advance, currentCard, isFinished, wrapUp } from '../engine/session';
import { buildChoices, blankSentence } from '../engine/lists';
import { OP_SYMBOL } from '../engine/generators';
import { parseMixed } from '../engine/fractions';
import type { Card, Deck, Mode, Session } from '../engine/types';
import { cancelSpeech, sayWord, speak, speakSpelling, spellOut, ttsAvailable } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { Owl } from '../ui/art';
import { Confirm } from '../ui/common';
import { Choices, FracView, FractionInput, LetterDiff, MixedView, NumberPad, TextAnswer } from '../ui/inputs';
import { UsMap, WorldMap } from '../ui/maps';
import { VisualAid, hasAid } from '../ui/aids';
import { createSession, finishSession, recordAnswer } from './practice/runner';
import { MediaImage } from './practice/MediaImage';

const YES = ['Yes!', 'Nice work!', 'You got it!', 'Great job!', 'Super!'];
const TRY = ["Almost! Here's the answer.", "Let's look at it together.", "Good try — this one's tricky."];
const OP_WORD = { add: 'plus', sub: 'minus', mul: 'times', div: 'divided by' } as const;

type Props = { kind: 'today' | 'deck'; deckId?: string; mode?: Mode; resumeId?: string };

interface Feedback {
  correct: boolean;
  given: string;
  message?: string;
  phrase: string;
}

/** Which input a card uses, given the deck & chosen mode. */
export function effectiveMode(card: Card, deck: Deck | undefined, routeMode: Mode | undefined, deckCards: Card[]): Mode {
  let m: Mode = routeMode && routeMode !== 'sprint' ? routeMode : (deck?.defaultMode ?? 'type');
  if (card.kind === 'frac-compare') return 'compare';
  if (card.kind === 'frac-reduce' || card.kind === 'frac-to-mixed' || card.kind === 'mixed-to-improper') return 'fraction';
  if (m === 'spell' || m === 'lcw' || m === 'spell-test') return card.kind === 'spell' || card.kind === 'sight' ? m : 'type';
  if (card.kind === 'spell') return 'spell';
  if (m === 'numpad' && card.kind !== 'math') m = 'type';
  if (m === 'choice' && card.kind !== 'math' && !card.choicePool && new Set(deckCards.map((c) => c.answer)).size < 3) m = 'type';
  return m;
}

function spokenPrompt(card: Card): string {
  const d = card.data;
  if (card.kind === 'math' && d?.op) return `${d.a} ${OP_WORD[d.op]} ${d.b}`;
  if (card.kind === 'sight' || card.kind === 'spell') return card.answer;
  return card.prompt.text ?? '';
}

export default function Practice({ kind, deckId, mode: routeMode, resumeId }: Props) {
  const { childId, child, go } = useApp();
  const s = childSettings(child);
  const [session, setSession] = useState<Session | null>(null);
  const [cards, setCards] = useState<Map<string, Card>>(new Map());
  const [decks, setDecks] = useState<Map<string, Deck>>(new Map());
  const [empty, setEmpty] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [showAid, setShowAid] = useState(false);
  const [almost, setAlmost] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);
  const [copied, setCopied] = useState(false);
  const [lcwHidden, setLcwHidden] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [missStreak, setMissStreak] = useState(0);
  const [announce, setAnnounce] = useState('');
  const shownAt = useRef(Date.now());
  const limitAt = useRef(Infinity);
  const wrapped = useRef(false);
  const started = useRef(false);
  const advanceTimer = useRef<number>();

  // ---- Load / create session (guarded against StrictMode double-run)
  useEffect(() => {
    if (!childId || started.current) return;
    started.current = true;
    (async () => {
      const [{ decks: ds, cards: cs }, today] = await Promise.all([childDecks(childId), dayTotals(childId, startOfDay())]);
      setCards(new Map(cs.map((c) => [c.id, c])));
      setDecks(new Map(ds.map((d) => [d.id, d])));
      const sess = resumeId ? await db.sessions.get(resumeId) : await createSession(childId, { kind, deckId, mode: routeMode });
      if (!sess) return setEmpty(true);
      const remainingDaily = s.dailyLimitMinutes > 0 ? Math.max(1, s.dailyLimitMinutes - today.minutes) : Infinity;
      limitAt.current = Date.now() + Math.min(s.sessionMinutes, remainingDaily) * 60_000;
      setSession(sess);
    })();
    return () => {
      cancelSpeech();
      window.clearTimeout(advanceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [childId]);

  const cardId = session?.queue ? currentCard(session.queue) : undefined;
  const card = cardId ? cards.get(cardId) : undefined;
  const deck = card ? decks.get(card.deckId) : undefined;
  const deckCards = useMemo(() => (card ? [...cards.values()].filter((c) => c.deckId === card.deckId) : []), [card, cards]);
  const mode = card ? effectiveMode(card, deck, session?.mode, deckCards) : 'type';
  const isTest = session?.kind === 'test';
  const isSpell = mode === 'spell' || mode === 'spell-test' || mode === 'lcw';
  const subject = deck ? subjectById(deck.subjectId) : undefined;
  const choiceCount = (child?.grade ?? 3) <= 1 ? 3 : 4;
  const options = useMemo(
    () => (card && mode === 'choice' ? buildChoices(card, deckCards, choiceCount) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [card?.id, mode, session?.queue?.idx],
  );
  const noVoice = !ttsAvailable() && !card?.prompt.audioRef;

  const readAloud = useCallback(
    (slow = false) => {
      if (!card) return;
      const rate = slow ? 0.6 : s.speechRate;
      if (isSpell) return speakSpelling(card.answer, card.kind === 'spell' ? card.exampleSentence : undefined, card.prompt.audioRef, rate);
      cancelSpeech();
      if (card.kind === 'sight') return sayWord(card.answer, card.prompt.audioRef, rate);
      const extra = mode === 'choice' ? `. Is it: ${options.join(', or ')}?` : '';
      return speak(spokenPrompt(card) + extra, rate);
    },
    [card, isSpell, mode, options, s.speechRate],
  );

  // ---- New card appears
  useEffect(() => {
    if (!card) return;
    shownAt.current = Date.now();
    setFeedback(null);
    setHintLevel(0);
    setShowAid(false);
    setAlmost(null);
    setCopied(false);
    setFlipped(false);
    setLcwHidden(false);
    setInputKey((k) => k + 1);
    const pos = `Card ${(session?.queue?.idx ?? 0) + 1} of ${session?.queue?.queue.length}.`;
    setAnnounce(isSpell ? `${pos} Spell the word you hear.` : `${pos} ${spokenPrompt(card)}`);
    let t: number | undefined;
    if (mode === 'lcw') t = window.setTimeout(() => setLcwHidden(true), 3000);
    const auto = s.audioAutoplay && (isSpell || (child?.grade ?? 3) <= 1);
    if (auto) readAloud();
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, session?.queue?.idx]);

  const finish = useCallback(
    async (sess: Session, completed: boolean) => {
      cancelSpeech();
      const done = await finishSession(sess, completed);
      go({ name: 'summary', sessionId: done.id });
    },
    [go],
  );

  const next = useCallback(
    async (sess: Session) => {
      window.clearTimeout(advanceTimer.current);
      let q = sess.queue!;
      if (!isTest && !wrapped.current && Date.now() >= limitAt.current) {
        wrapped.current = true;
        q = wrapUp(q);
        sess = { ...sess, queue: q };
        await db.sessions.put(sess);
      }
      if (isFinished(q)) return finish(sess, true);
      setSession(sess);
    },
    [finish, isTest],
  );

  // ---- Answering
  const submit = async (given: string, selfCheck?: boolean) => {
    if (!card || !session?.queue || feedback || busy) return;
    const checkCard = mode === 'spell' || mode === 'lcw' || mode === 'spell-test' ? { ...card, kind: 'spell' as const } : card;
    const res =
      selfCheck !== undefined
        ? { result: selfCheck ? ('correct' as const) : ('incorrect' as const) }
        : checkAnswer(checkCard, given, { typoTolerance: s.typoTolerance, caseSensitive: deck?.caseSensitive });
    // RF-03 / IF-02: one free retry for right-value-wrong-form.
    if (res.result === 'almost' && !almost && !isTest) {
      setAlmost(res.message);
      setAnnounce(res.message);
      setInputKey((k) => k + 1);
      return;
    }
    const correct = res.result === 'correct' || res.result === 'close';
    const missedBefore = session.queue.missed.includes(card.id);
    const usedHint = hintLevel > 0 || showAid;
    const outcome = !correct ? 'miss' : usedHint || missedBefore || almost ? 'with-help' : 'first-try';
    setBusy(true);
    const updated = await recordAnswer({
      session,
      card,
      mode,
      answer: given,
      correct,
      outcome,
      usedHint,
      responseMs: Date.now() - shownAt.current,
      nextQueue: advance(session.queue, isTest ? true : correct),
    });
    setBusy(false);
    setMissStreak((m) => (correct ? 0 : m + 1));
    if (isTest) return next(updated); // CS-07: no feedback until the end
    if (selfCheck === false) {
      // Flip "Not yet": they've already seen the answer.
      sfx.tryAgain();
      return next(updated);
    }
    const msg = 'message' in res ? res.message : undefined;
    const fb: Feedback = { correct, given, message: msg, phrase: correct ? YES[Math.floor(Math.random() * YES.length)] : TRY[Math.floor(Math.random() * TRY.length)] };
    setFeedback(fb);
    setSession({ ...updated, queue: session.queue }); // keep showing this card during feedback
    pendingNext.current = updated;
    if (correct) {
      sfx.correct();
      setAnnounce(`${fb.phrase} ${msg ?? ''}`);
      advanceTimer.current = window.setTimeout(() => next(updated), res.result === 'close' ? 2200 : 1000);
    } else {
      sfx.tryAgain();
      setAnnounce(`${fb.phrase} The answer is ${spokenAnswer(card)}.`);
      if (isSpell) spellOut(card.answer, s.speechRate);
    }
  };
  const pendingNext = useRef<Session | null>(null);
  const gotIt = () => pendingNext.current && next(pendingNext.current);

  // ---- Render
  if (empty)
    return (
      <ChildScreen>
        <main className="child-main center stack-gap">
          <Owl size={110} mood="cheer" />
          <h1>All caught up!</h1>
          <p>Nothing is due right now. Great job!</p>
          <button className="btn primary big" onClick={() => go({ name: 'home' })}>
            Back home
          </button>
        </main>
      </ChildScreen>
    );
  if (!session || !card) return <ChildScreen>{null}</ChildScreen>;

  const q = session.queue!;
  const pct = Math.round((q.idx / Math.max(1, q.queue.length)) * 100);
  const state = feedback ? (feedback.correct ? 'state-correct' : 'state-wrong') : '';
  const locked = !!feedback || busy;
  const hintText = isSpell ? undefined : card.hint;
  const canHint = !isTest && s.hintsAllowed && (isSpell || !!hintText);

  return (
    <ChildScreen>
      <div className="topbar">
        <div className="progressbar" role="progressbar" aria-valuenow={q.idx} aria-valuemin={0} aria-valuemax={q.queue.length} aria-label={`Card ${q.idx + 1} of ${q.queue.length}`}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <span className="chip" aria-hidden>
          {Math.min(q.idx + 1, q.queue.length)} / {q.queue.length}
        </span>
        <button className="btn ghost icon-btn" onClick={() => setQuitting(true)} aria-label="Pause or stop">
          <Pause aria-hidden />
        </button>
      </div>
      <div className="sr-only" aria-live="polite">
        {announce}
      </div>

      <main className="child-main practice">
        {missStreak >= 3 && !feedback && (
          <div className="row" role="status">
            <Owl size={56} mood="cheer" />
            <b>You're working hard! Keep going — you've got this.</b>
          </div>
        )}
        {isTest && <div className="badge">Test Day — no hints, one try each</div>}

        {mode === 'flip' ? (
          <FlipCard card={card} flipped={flipped} subjectColor={subject?.color} />
        ) : (
          <section className={`card-surface flashcard ${state}`} style={{ ['--subject' as string]: `var(--${subject?.color ?? 'spelling'})` }} aria-label="Flash card">
            {feedback?.correct && <Star className="star-fly" size={36} fill="currentColor" aria-hidden />}
            <PromptFace card={card} mode={mode} lcwHidden={lcwHidden} hintLevel={hintLevel} noVoice={noVoice} mathFormat={deck?.generatorConfig?.kind === 'math' ? deck.generatorConfig.math.display : 'horizontal'} />
            {almost && !feedback && (
              <div className="feedback amber" role="status">
                <Hand aria-hidden /> {almost}
              </div>
            )}
            {feedback && <FeedbackPanel card={card} fb={feedback} mode={mode} />}
          </section>
        )}

        {/* Utility row */}
        {!feedback && (
          <div className="utility">
            {!(mode === 'lcw' && !lcwHidden) && (
              <button className="btn" onClick={() => readAloud()} aria-label={isSpell ? 'Hear it again' : 'Read it to me'}>
                <Volume2 aria-hidden /> {isSpell ? 'Hear it again' : 'Read it'}
              </button>
            )}
            {isSpell && (
              <button className="btn" onClick={() => readAloud(true)}>
                <Snail aria-hidden /> Slow
              </button>
            )}
            {isSpell && card.exampleSentence && (
              <button className="btn" onClick={() => speak(card.exampleSentence!, s.speechRate)}>
                <MessageSquareText aria-hidden /> Sentence
              </button>
            )}
            {canHint && (
              <button className="btn" onClick={() => setHintLevel((h) => Math.min(h + 1, 2))} disabled={isSpell ? hintLevel >= 2 : hintLevel >= 1}>
                <Lightbulb aria-hidden /> Hint
              </button>
            )}
            {!isTest && hasAid(card) && (
              <button className="btn" onClick={() => setShowAid((v) => !v)} aria-pressed={showAid}>
                <Eye aria-hidden /> Show me
              </button>
            )}
          </div>
        )}
        {!feedback && hintLevel > 0 && hintText && (
          <p className="feedback" role="status">
            <Lightbulb aria-hidden /> {hintText}
          </p>
        )}
        {(showAid || (feedback && !feedback.correct && card.kind === 'frac-compare')) && <VisualAid card={card} />}

        {/* Input */}
        {feedback && !feedback.correct ? (
          <WrongActions card={card} isSpell={isSpell} copied={copied} setCopied={setCopied} onGotIt={gotIt} />
        ) : mode === 'flip' ? (
          !flipped ? (
            <button className="btn primary big" onClick={() => setFlipped(true)}>
              Flip the card
            </button>
          ) : (
            <div className="row" style={{ justifyContent: 'center' }}>
              <button className="btn good big" onClick={() => submit(card.answer, true)} disabled={locked}>
                <Check aria-hidden /> I got it
              </button>
              <button className="btn big" onClick={() => submit('', false)} disabled={locked}>
                Not yet
              </button>
            </div>
          )
        ) : mode === 'lcw' && !lcwHidden ? (
          <p className="muted">Look carefully…</p>
        ) : mode === 'numpad' ? (
          <NumberPad key={inputKey} onSubmit={submit} disabled={locked} />
        ) : mode === 'choice' ? (
          <Choices options={options} onPick={submit} picked={feedback?.given} correct={feedback ? card.answer : undefined} />
        ) : mode === 'compare' ? (
          <CompareButtons onPick={submit} disabled={locked} />
        ) : mode === 'fraction' ? (
          <FractionInput key={inputKey} withWhole={card.kind === 'frac-to-mixed'} onSubmit={submit} disabled={locked} />
        ) : (
          <TextAnswer onSubmit={submit} disabled={locked} resetKey={inputKey} label={isSpell ? 'Type the word you heard' : 'Type your answer'} />
        )}
      </main>

      {quitting && (
        <Confirm
          title="Stop for today?"
          body="Your progress is saved."
          yes="Stop"
          no="Keep going"
          onNo={() => setQuitting(false)}
          onYes={() => {
            setQuitting(false);
            finish(pendingNext.current && feedback ? pendingNext.current : session, false);
          }}
        />
      )}
    </ChildScreen>
  );
}

function spokenAnswer(card: Card): string {
  if (card.kind === 'frac-compare') return card.answer === '<' ? 'less than' : card.answer === '>' ? 'greater than' : 'equal';
  return card.answer;
}

function CompareButtons({ onPick, disabled }: { onPick: (v: string) => void; disabled: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (disabled) return;
      if (e.key === '<' || e.key === ',') onPick('<');
      if (e.key === '=') onPick('=');
      if (e.key === '>' || e.key === '.') onPick('>');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onPick, disabled]);
  return (
    <div className="compare-btns" role="group" aria-label="Compare">
      <button className="btn" onClick={() => onPick('<')} disabled={disabled} aria-label="is less than">
        &lt;
      </button>
      <button className="btn" onClick={() => onPick('=')} disabled={disabled} aria-label="is equal to">
        =
      </button>
      <button className="btn" onClick={() => onPick('>')} disabled={disabled} aria-label="is greater than">
        &gt;
      </button>
    </div>
  );
}

function PromptFace({ card, mode, lcwHidden, hintLevel, noVoice, mathFormat }: { card: Card; mode: Mode; lcwHidden: boolean; hintLevel: number; noVoice: boolean; mathFormat: 'horizontal' | 'vertical' }) {
  const d = card.data ?? {};
  if (mode === 'spell' || mode === 'spell-test') {
    const sentence = card.exampleSentence ? blankSentence(card.exampleSentence, card.answer) : undefined;
    const showLetters = hintLevel >= 1 || noVoice;
    return (
      <>
        <Volume2 size={56} aria-hidden style={{ color: 'var(--spelling)' }} />
        <div className="prompt sm">Spell the word you hear</div>
        {sentence && <p className="muted" style={{ fontSize: '1.1em' }}>{sentence}</p>}
        {noVoice && <p className="muted">Sound is off on this device — use the sentence and the first letter.</p>}
        {showLetters && (
          <div className="letter-boxes" aria-label={`${card.answer.length} letters${hintLevel >= 2 || noVoice ? `, starting with ${card.answer[0]}` : ''}`}>
            {card.answer.split('').map((ch, i) => (
              <span key={i}>{i === 0 && (hintLevel >= 2 || noVoice) ? ch : ''}</span>
            ))}
          </div>
        )}
      </>
    );
  }
  if (mode === 'lcw')
    return lcwHidden ? <div className="prompt sm">Now write it from memory!</div> : <div className="prompt">{card.answer}</div>;
  if (card.kind === 'math' && d.op) {
    const sym = OP_SYMBOL[d.op];
    if (mathFormat === 'vertical')
      return (
        <div className="prompt" style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }} aria-label={`${d.a} ${OP_WORD[d.op]} ${d.b}`}>
          <div aria-hidden>{d.a}</div>
          <div aria-hidden style={{ borderBottom: '5px solid currentColor', paddingBottom: 4 }}>
            {sym} {d.b}
          </div>
        </div>
      );
    return (
      <div className="prompt" aria-label={`${d.a} ${OP_WORD[d.op]} ${d.b} equals what?`}>
        <span aria-hidden>
          {d.a} {sym} {d.b} = ?
        </span>
      </div>
    );
  }
  if (card.kind === 'frac-compare' && d.f1 && d.f2)
    return (
      <>
        <div className="muted">Which sign goes in the box?</div>
        <div className="prompt row" style={{ justifyContent: 'center', gap: 24 }}>
          <FracView f={d.f1} />
          <span className="answer-display" style={{ minWidth: 72, fontSize: '0.8em' }} aria-label="blank">
            ?
          </span>
          <FracView f={d.f2} />
        </div>
      </>
    );
  if (card.kind === 'frac-reduce' && d.f1)
    return (
      <>
        <div className="muted">Write it in simplest form</div>
        <div className="prompt">
          <FracView f={d.f1} />
        </div>
      </>
    );
  if (card.kind === 'frac-to-mixed' && d.f1)
    return (
      <>
        <div className="muted">Write it as a whole or mixed number</div>
        <div className="prompt">
          <FracView f={d.f1} />
        </div>
      </>
    );
  if (card.kind === 'mixed-to-improper' && d.mixed)
    return (
      <>
        <div className="muted">Write it as an improper fraction</div>
        <div className="prompt">
          <MixedView m={d.mixed} />
        </div>
      </>
    );
  if (card.kind === 'geo-map')
    return (
      <>
        {d.stateId && <UsMap highlight={d.stateId} />}
        {d.continent && <WorldMap continent={d.continent} />}
        <div className="prompt sm">{card.prompt.text}</div>
      </>
    );
  return (
    <>
      {card.prompt.imageRef && <MediaImage id={card.prompt.imageRef} />}
      <div className={`prompt ${(card.prompt.text?.length ?? 0) > 24 ? 'sm' : ''}`}>{card.prompt.text}</div>
    </>
  );
}

function FlipCard({ card, flipped, subjectColor }: { card: Card; flipped: boolean; subjectColor?: string }) {
  const style = { ['--subject' as string]: `var(--${subjectColor ?? 'reading'})` };
  return (
    <div className={`flip ${flipped ? 'flipped' : ''}`}>
      <div className="flip-inner">
        <section className="card-surface flashcard flip-face front" style={style} aria-hidden={flipped}>
          {card.prompt.imageRef && <MediaImage id={card.prompt.imageRef} />}
          <div className="prompt">{card.prompt.text}</div>
          {card.kind === 'sight' && <div className="muted">Say it out loud!</div>}
        </section>
        <section className="card-surface flashcard flip-face back" style={style} aria-hidden={!flipped} aria-live="polite">
          <div className="muted">Answer</div>
          <div className="prompt">{card.answer}</div>
          <div className="muted">Did you get it?</div>
        </section>
      </div>
    </div>
  );
}

function FeedbackPanel({ card, fb, mode }: { card: Card; fb: Feedback; mode: Mode }) {
  if (fb.correct)
    return (
      <div className="feedback good celebrate" role="status">
        <Check size={32} aria-hidden /> {fb.phrase} {fb.message && <span style={{ fontWeight: 400 }}>{fb.message}</span>}
      </div>
    );
  const d = card.data ?? {};
  let answer: React.ReactNode = <b className="prompt sm">{card.answer}</b>;
  if (card.kind === 'math' && d.op) answer = <b className="prompt sm">{`${d.a} ${OP_SYMBOL[d.op]} ${d.b} = ${card.answer}`}</b>;
  if (card.kind === 'frac-compare' && d.f1 && d.f2)
    answer = (
      <div className="prompt row" style={{ justifyContent: 'center', gap: 20 }}>
        <FracView f={d.f1} /> <span>{card.answer}</span> <FracView f={d.f2} />
      </div>
    );
  if (card.kind === 'frac-reduce' || card.kind === 'frac-to-mixed' || card.kind === 'mixed-to-improper') {
    const m = parseMixed(card.answer);
    answer = <div className="prompt">{m ? m.d ? <MixedView m={m} /> : m.w : card.answer}</div>;
  }
  const spelling = mode === 'spell' || mode === 'lcw' || mode === 'spell-test';
  return (
    <div className="stack-gap center" role="status">
      <div className="feedback amber" style={{ justifyContent: 'center' }}>
        <Owl size={48} mood="think" /> {fb.phrase}
      </div>
      {spelling ? <LetterDiff given={fb.given} answer={card.answer} /> : (
        <>
          {fb.given && mode !== 'choice' && (
            <div className="muted">
              You said: <s>{fb.given}</s>
            </div>
          )}
          {answer}
        </>
      )}
      {card.exampleSentence && !spelling && <p className="muted">{card.exampleSentence}</p>}
    </div>
  );
}

function WrongActions({ card, isSpell, copied, setCopied, onGotIt }: { card: Card; isSpell: boolean; copied: boolean; setCopied: (v: boolean) => void; onGotIt: () => void }) {
  const [tryMsg, setTryMsg] = useState('');
  // CS-11: after a spelling miss, type it correctly once before moving on.
  if (isSpell && !copied)
    return (
      <div className="stack-gap center" style={{ width: '100%' }}>
        <p>
          <b>Now type it the right way once:</b>
        </p>
        <TextAnswer
          label="Type the word correctly"
          onSubmit={(v) => {
            if (normalize(v) === normalize(card.answer)) {
              sfx.correct();
              setCopied(true);
            } else setTryMsg('Look at the letters again and try once more.');
          }}
        />
        {tryMsg && (
          <p className="feedback amber" role="status">
            {tryMsg}
          </p>
        )}
      </div>
    );
  return <GotIt onGotIt={onGotIt} />;
}

function GotIt({ onGotIt }: { onGotIt: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <button ref={ref} className="btn primary big" onClick={onGotIt}>
      <Check aria-hidden /> Got it
    </button>
  );
}
