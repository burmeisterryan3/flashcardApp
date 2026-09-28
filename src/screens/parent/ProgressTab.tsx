// WF-09 Parent progress view (05 "Parent progress view").
import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Target } from 'lucide-react';
import { useApp } from '../../app';
import { db, progressMap, setFocus } from '../../db/db';
import { SUBJECTS, subjectById } from '../../content/catalog';
import { deckMastery, masteryLevel } from '../../engine/leitner';
import { displayStreak, newRewards, weekKey } from '../../engine/rewards';
import { describeCard } from '../../engine/generators';
import type { Attempt, Card } from '../../engine/types';
import { testLabel } from '../hooks';
import { ChildPicker, MasteryBar, fmtDate } from './shared';

const DAY = 864e5;

export default function ProgressTab() {
  const { childId: current } = useApp();
  const [childId, setChildId] = useState<string | null>(current);
  const data = useLiveQuery(async () => {
    if (!childId) return undefined;
    const since = Date.now() - 28 * DAY;
    const [decks, progress, attempts, rewards] = await Promise.all([
      db.decks.toArray(),
      progressMap(childId),
      db.attempts.where('[childId+timestamp]').between([childId, since], [childId, Date.now() + 1]).toArray(),
      db.rewards.get(childId),
    ]);
    const mine = decks.filter((d) => d.assignedChildIds.includes(childId) && !d.archived).sort((a, b) => a.order - b.order);
    const cards = await db.cards.where('deckId').anyOf(mine.map((d) => d.id)).toArray();
    return { decks: mine, cards, progress, attempts, rewards: rewards ?? newRewards(childId) };
  }, [childId]);
  const [openDeck, setOpenDeck] = useState<string | null>(null);

  const view = useMemo(() => {
    if (!data) return null;
    const now = Date.now();
    const weekStart = new Date(weekKey(now).replace(/-/g, '/')).getTime();
    const week = data.attempts.filter((a) => a.timestamp >= weekStart);
    const days = new Set(week.map((a) => new Date(a.timestamp).toDateString())).size;
    const minutes = Math.round(week.reduce((s, a) => s + Math.min(a.responseMs, 60_000), 0) / 60000);
    const cardsPracticed = new Set(week.map((a) => `${a.sessionId}|${a.cardId}`)).size;
    const cardById = new Map(data.cards.map((c) => [c.id, c]));

    // Trouble cards: most misses in 14 days, with actual wrong answers.
    const recent = data.attempts.filter((a) => a.timestamp >= now - 14 * DAY && a.mode !== 'sprint');
    const misses = new Map<string, Attempt[]>();
    for (const a of recent) if (!a.correct) misses.set(a.cardId, [...(misses.get(a.cardId) ?? []), a]);
    const trouble = [...misses.entries()]
      .filter(([id]) => cardById.has(id))
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 12)
      .map(([id, as]) => ({ card: cardById.get(id)!, misses: as.length, wrong: [...new Set(as.map((a) => a.answerGiven).filter(Boolean))].slice(0, 3) }));

    // Trend: accuracy per subject for each of the last 4 weeks.
    const deckSub = new Map(data.decks.map((d) => [d.id, d.subjectId]));
    const weeks = [3, 2, 1, 0].map((w) => weekStart - w * 7 * DAY);
    const trend = SUBJECTS.map((s) => ({
      subject: s,
      points: weeks.map((ws) => {
        const as = data.attempts.filter((a) => a.timestamp >= ws && a.timestamp < ws + 7 * DAY && deckSub.get(a.deckId) === s.id);
        return as.length ? Math.round((as.filter((a) => a.correct).length / as.length) * 100) : null;
      }),
    })).filter((t) => t.points.some((p) => p !== null));

    const lastByDeck = new Map<string, number>();
    for (const a of data.attempts) lastByDeck.set(a.deckId, Math.max(lastByDeck.get(a.deckId) ?? 0, a.timestamp));
    return { days, minutes, cardsPracticed, trouble, trend, weeks, lastByDeck, streak: displayStreak(data.rewards, now) };
  }, [data]);

  if (!data || !view) return <ChildPicker value={childId} onChange={setChildId} />;
  const cardsOf = (deckId: string) => data.cards.filter((c) => c.deckId === deckId);
  const tests = data.decks.filter((d) => testLabel(d.testDate));

  return (
    <>
      <ChildPicker value={childId} onChange={setChildId} />
      <section className="panel">
        <h2>This week</h2>
        <div className="stats">
          <div className="stat">
            <b>{view.days}</b> days practiced
          </div>
          <div className="stat">
            <b>{view.minutes}</b> minutes
          </div>
          <div className="stat">
            <b>{view.cardsPracticed}</b> cards practiced
          </div>
          <div className="stat">
            <b>{view.streak}</b> day streak
          </div>
          <div className="stat">
            <b>{data.rewards.stars}</b> stars total
          </div>
        </div>
      </section>

      {tests.length > 0 && (
        <section className="panel">
          <h2>Upcoming tests</h2>
          <table className="list responsive">
            <tbody>
              {tests.map((d) => {
                const m = deckMastery(cardsOf(d.id).map((c) => c.id), data.progress);
                return (
                  <tr key={d.id}>
                    <td>{d.name}</td>
                    <td>{testLabel(d.testDate)}</td>
                    <td>
                      <b>{m.readiness}%</b> ready
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      <section className="panel">
        <h2>Trouble cards (last 14 days)</h2>
        {view.trouble.length === 0 ? (
          <p className="muted">Nothing tricky yet — great!</p>
        ) : (
          <table className="list responsive">
            <thead>
              <tr>
                <th>Card</th>
                <th>Misses</th>
                <th>Answers given</th>
                <th>
                  <span className="sr-only">Focus</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {view.trouble.map((t) => {
                const focused = data.progress.get(t.card.id)?.focus;
                return (
                  <tr key={t.card.id}>
                    <td>{describeCard(t.card)}</td>
                    <td>{t.misses}</td>
                    <td className="muted">{t.wrong.join(', ') || '—'}</td>
                    <td>
                      <button className={`btn small ${focused ? 'primary' : 'ghost'}`} aria-pressed={!!focused} onClick={() => setFocus(childId!, t.card, !focused)}>
                        <Target size={16} aria-hidden /> {focused ? 'In focus' : 'Add to focus'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h2>Accuracy trend (4 weeks)</h2>
        {view.trend.length === 0 ? <p className="muted">Practice a few days to see a trend.</p> : <TrendChart trend={view.trend} weeks={view.weeks} />}
      </section>

      <section className="panel">
        <h2>Decks</h2>
        <p className="muted" style={{ fontSize: '0.9em' }}>
          Bars: <span style={{ color: 'var(--good)' }}>■</span> mastered · <span style={{ color: 'var(--math)' }}>■</span> getting there · <span style={{ color: 'var(--amber-line)' }}>■</span> learning · grey not started. Tap a deck for card-by-card detail.
        </p>
        <table className="list responsive">
          <thead>
            <tr>
              <th>Deck</th>
              <th>Mastery</th>
              <th>Last practiced</th>
            </tr>
          </thead>
          <tbody>
            {data.decks.map((d) => {
              const cs = cardsOf(d.id);
              const m = deckMastery(cs.map((c) => c.id), data.progress);
              const open = openDeck === d.id;
              return (
                <DeckRows key={d.id} name={`${d.name}`} subject={subjectById(d.subjectId).name} m={m} last={view.lastByDeck.get(d.id) ?? 0} open={open} onToggle={() => setOpenDeck(open ? null : d.id)} cards={cs} data={data} childId={childId!} />
              );
            })}
          </tbody>
        </table>
      </section>
    </>
  );
}

function DeckRows({
  name,
  subject,
  m,
  last,
  open,
  onToggle,
  cards,
  data,
  childId,
}: {
  name: string;
  subject: string;
  m: ReturnType<typeof deckMastery>;
  last: number;
  open: boolean;
  onToggle: () => void;
  cards: Card[];
  data: { progress: Map<string, import('../../engine/types').CardProgress>; attempts: Attempt[] };
  childId: string;
}) {
  return (
    <>
      <tr>
        <td>
          <button className="btn ghost small" onClick={onToggle} aria-expanded={open} style={{ textAlign: 'left' }}>
            {name} <span className="muted">· {subject}</span>
          </button>
        </td>
        <td>
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <MasteryBar m={m.mastered} g={m.getting} l={m.learning} n={m.fresh} />
            <span>{m.pctMastered}%</span>
          </div>
        </td>
        <td>{fmtDate(last)}</td>
      </tr>
      {open && (
        <tr>
          <td colSpan={3}>
            <table className="list" style={{ fontSize: '0.9em' }}>
              <thead>
                <tr>
                  <th>Card</th>
                  <th>Level</th>
                  <th>Accuracy</th>
                  <th>Last seen</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {cards.map((c) => {
                  const p = data.progress.get(c.id);
                  const as = data.attempts.filter((a) => a.cardId === c.id && a.mode !== 'sprint');
                  const acc = as.length ? `${Math.round((as.filter((a) => a.correct).length / as.length) * 100)}% (${as.length})` : '—';
                  const lvl = masteryLevel(p);
                  return (
                    <tr key={c.id}>
                      <td>{describeCard(c)}</td>
                      <td>{{ new: 'Not started', learning: 'Learning', 'getting-there': 'Getting there', mastered: 'Mastered' }[lvl]}</td>
                      <td>{acc}</td>
                      <td>{fmtDate(p?.lastSeenAt ?? 0)}</td>
                      <td>
                        <button className={`btn small ${p?.focus ? 'primary' : 'ghost'}`} aria-pressed={!!p?.focus} onClick={() => setFocus(childId, c, !p?.focus)}>
                          {p?.focus ? 'In focus' : 'Focus'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

function TrendChart({ trend, weeks }: { trend: { subject: (typeof SUBJECTS)[number]; points: (number | null)[] }[]; weeks: number[] }) {
  const W = 560;
  const H = 200;
  const pad = { l: 40, r: 110, t: 10, b: 30 };
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / 3;
  const y = (v: number) => pad.t + ((100 - v) * (H - pad.t - pad.b)) / 100;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W }} role="img" aria-label={trend.map((t) => `${t.subject.name}: ${t.points.map((p) => (p === null ? 'no practice' : `${p}%`)).join(', ')}`).join('. ')}>
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={pad.l} x2={W - pad.r} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={pad.l - 6} y={y(v) + 4} fontSize="11" textAnchor="end" fill="var(--muted)">
            {v}%
          </text>
        </g>
      ))}
      {weeks.map((w, i) => (
        <text key={w} x={x(i)} y={H - 8} fontSize="11" textAnchor="middle" fill="var(--muted)">
          {i === 3 ? 'This week' : fmtDate(w)}
        </text>
      ))}
      {trend.map((t) => {
        const pts = t.points.map((p, i) => (p === null ? null : [x(i), y(p)] as const)).filter(Boolean) as (readonly [number, number])[];
        const lastPt = pts[pts.length - 1];
        return (
          <g key={t.subject.id} stroke={`var(--${t.subject.color})`} fill={`var(--${t.subject.color})`}>
            <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" strokeWidth="3" />
            {pts.map((p, i) => (
              <circle key={i} cx={p[0]} cy={p[1]} r="4" />
            ))}
            {lastPt && (
              <text x={W - pad.r + 8} y={lastPt[1] + 4} fontSize="12" stroke="none">
                {t.subject.name}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

