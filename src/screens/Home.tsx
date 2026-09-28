// S-02 Child Home (WF-02). Today's Practice is one tap from here (PO-01).
import { useState } from 'react';
import { Flame, Lock, Play, Settings, Star, Sticker } from 'lucide-react';
import { ChildScreen, childSettings, useApp } from '../app';
import { db } from '../db/db';
import { SUBJECTS } from '../content/catalog';
import { displayStreak } from '../engine/rewards';
import { deckMastery } from '../engine/leitner';
import { Avatar, Owl, SubjectIcon } from '../ui/art';
import { ProgressRing } from '../ui/common';
import { useChildData } from './hooks';

export default function Home() {
  const { child, childId, go, parent } = useApp();
  const data = useChildData(childId);
  const [dismissedResume, setDismissedResume] = useState(false);
  if (!child || !data) return <ChildScreen>{null}</ChildScreen>;
  const s = childSettings(child);
  const streak = displayStreak(data.rewards, Date.now());
  const goal = s.dailyGoalCards;
  const done = data.today.cards;
  const limitReached = s.dailyLimitMinutes > 0 && data.today.minutes >= s.dailyLimitMinutes;
  const subjects = SUBJECTS.filter((sub) => data.decks.some((d) => d.subjectId === sub.id));

  const switchProfile = () => (parent?.requirePinToSwitch ? go({ name: 'parent', then: { name: 'profiles' } }) : go({ name: 'profiles' }));

  return (
    <ChildScreen>
      <div className="topbar">
        <button className="btn ghost icon-btn" onClick={switchProfile} aria-label={`${child.name}. Switch player`}>
          <Avatar id={child.avatarId} size={44} />
        </button>
        <h1 style={{ margin: 0, fontSize: '1.3em' }}>Hi, {child.name}!</h1>
        <span className="spacer" />
        <span className="chip" aria-label={`${streak} day streak`}>
          <Flame size={22} color="#e8590c" aria-hidden /> {streak}
        </span>
        <span className="chip" aria-label={`${data.rewards.stars} stars`}>
          <Star size={22} color="var(--star)" fill="var(--star)" aria-hidden /> {data.rewards.stars}
        </span>
      </div>

      <main className="child-main stack-gap">
        {data.resumable && !dismissedResume && (
          <div className="card-surface row" style={{ padding: 16 }} role="region" aria-label="Unfinished practice">
            <Owl size={56} mood="think" />
            <div style={{ flex: 1 }}>
              <b>Keep going?</b>
              <div className="muted">You have a practice you didn't finish.</div>
            </div>
            <button className="btn good" onClick={() => go({ name: 'practice', kind: data.resumable!.kind === 'today' ? 'today' : 'deck', deckId: data.resumable!.deckId, mode: data.resumable!.mode, resumeId: data.resumable!.id })}>
              <Play aria-hidden /> Keep going
            </button>
            <button
              className="btn ghost"
              onClick={async () => {
                await db.sessions.update(data.resumable!.id, { endedAt: Date.now() });
                setDismissedResume(true);
              }}
            >
              Start fresh
            </button>
          </div>
        )}

        {data.decks.length === 0 ? (
          <div className="card-surface center stack-gap" style={{ padding: 32 }}>
            <Owl size={96} mood="think" />
            <p>No cards yet! Ask a grown-up to add some decks.</p>
          </div>
        ) : limitReached ? (
          <div className="card-surface center stack-gap" style={{ padding: 32 }} role="status">
            <Owl size={96} mood="cheer" />
            <h2>Great work today — time for a break!</h2>
            <p className="muted">Come back tomorrow for more.</p>
          </div>
        ) : (
          <button className="hero" onClick={() => go({ name: 'practice', kind: 'today' })}>
            <ProgressRing value={done / goal} size={104}>
              <Play size={40} fill="#fff" aria-hidden />
            </ProgressRing>
            <span>
              Today's Practice
              <small>{done >= goal ? 'Goal done! Want to practice more?' : `${done} of ${goal} cards today`}</small>
            </span>
          </button>
        )}

        <div className="tiles">
          {subjects.map((sub) => {
            const ids = data.cards.filter((c) => data.decks.find((d) => d.id === c.deckId)?.subjectId === sub.id).map((c) => c.id);
            const m = deckMastery(ids, data.progress);
            return (
              <button key={sub.id} className="tile" style={{ background: `var(--${sub.color})` }} onClick={() => go({ name: 'decks', subject: sub.id })}>
                <SubjectIcon icon={sub.icon} size={36} />
                {sub.name}
                <small>{m.readiness}% learned</small>
                <span className="meter" aria-hidden>
                  <span style={{ width: `${m.readiness}%` }} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="row" style={{ justifyContent: 'space-between', marginTop: 24 }}>
          <div className="row">
            <Owl size={64} mood={done >= goal ? 'cheer' : 'happy'} />
            <span className="muted">{done >= goal ? `Goal done! ${streak > 1 ? `${streak} days in a row!` : ''}` : 'Every card makes you stronger!'}</span>
          </div>
          <button className="btn" onClick={() => go({ name: 'stickers' })}>
            <Sticker aria-hidden /> Sticker book
          </button>
          <button className="btn ghost small" onClick={() => go({ name: 'parent' })} aria-label="Grown-ups area">
            <Lock size={16} aria-hidden /> <Settings size={16} aria-hidden />
          </button>
        </div>
      </main>
    </ChildScreen>
  );
}
