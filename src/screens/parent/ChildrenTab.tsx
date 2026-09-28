// Children: profiles (up to 4) and per-child settings (WF-10).
import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { db, deleteChild } from '../../db/db';
import { builtinDeckId, suggestedDecks, suggestedSubjects } from '../../content/catalog';
import { newRewards } from '../../engine/rewards';
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type ChildSettings } from '../../engine/types';
import { Avatar } from '../../ui/art';
import { Confirm } from '../../ui/common';
import { ChildForm, GRADES } from '../Onboarding';
import { useChildren } from './shared';

export default function ChildrenTab() {
  const kids = useChildren();
  const [editing, setEditing] = useState<ChildProfile | 'new' | null>(null);
  const [removing, setRemoving] = useState<ChildProfile | null>(null);

  const save = async (c: ChildProfile) => {
    const isNew = editing === 'new';
    await db.children.put(c);
    if (isNew) {
      await db.rewards.put(newRewards(c.id));
      // Give a new child the grade-based starter decks (WF-01 defaults).
      const keys = suggestedDecks(c.grade, suggestedSubjects(c.grade));
      await db.transaction('rw', db.decks, async () => {
        for (const k of keys) {
          const d = await db.decks.get(builtinDeckId(k));
          if (d && !d.assignedChildIds.includes(c.id)) await db.decks.update(d.id, { assignedChildIds: [...d.assignedChildIds, c.id] });
        }
      });
    }
    setEditing(null);
  };

  if (editing) return <ChildForm title={editing === 'new' ? 'Add a child' : `Edit ${editing.name}`} initial={editing === 'new' ? undefined : editing} onSave={save} />;

  return (
    <>
      {kids.map((k) => (
        <section key={k.id} className="panel">
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div className="row">
              <Avatar id={k.avatarId} size={48} />
              <h2 style={{ margin: 0 }}>{k.name}</h2>
              <span className="muted">{GRADES[k.grade]}</span>
            </div>
            <div className="row">
              <button className="btn ghost small" onClick={() => setEditing(k)}>
                <Pencil size={16} aria-hidden /> Edit
              </button>
              <button className="btn ghost small" onClick={() => setRemoving(k)}>
                <Trash2 size={16} aria-hidden /> Remove
              </button>
            </div>
          </div>
          <ChildSettingsForm child={k} />
        </section>
      ))}
      {kids.length < 4 && (
        <button className="btn primary" onClick={() => setEditing('new')}>
          <Plus aria-hidden /> Add a child
        </button>
      )}
      {removing && (
        <Confirm
          title={`Remove ${removing.name}?`}
          body="This deletes their profile, stars, stickers and practice history on this device."
          yes="Remove"
          onNo={() => setRemoving(null)}
          onYes={async () => {
            await deleteChild(removing.id);
            setRemoving(null);
          }}
        />
      )}
    </>
  );
}

function ChildSettingsForm({ child }: { child: ChildProfile }) {
  const s: ChildSettings = { ...DEFAULT_CHILD_SETTINGS, ...child.settings };
  const set = (patch: Partial<ChildSettings>) => db.children.update(child.id, { settings: { ...s, ...patch } });
  const id = (x: string) => `${child.id}-${x}`;
  const toggle = (k: keyof ChildSettings, label: string) => (
    <label className="check" key={k}>
      <input type="checkbox" checked={!!s[k]} onChange={(e) => set({ [k]: e.target.checked } as Partial<ChildSettings>)} /> {label}
    </label>
  );
  return (
    <details style={{ marginTop: 12 }}>
      <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center', fontWeight: 600 }}>Practice settings</summary>
      <div className="row" style={{ alignItems: 'flex-start', gap: 24, marginTop: 8 }}>
        <div style={{ minWidth: 220 }}>
          <div className="field">
            <label htmlFor={id('cards')}>Cards per session</label>
            <select id={id('cards')} value={s.sessionCards} onChange={(e) => set({ sessionCards: +e.target.value })}>
              {[5, 10, 15, 20, 25, 30].map((n) => (
                <option key={n} value={n}>
                  {n} cards
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id('mins')}>Session time limit</label>
            <select id={id('mins')} value={s.sessionMinutes} onChange={(e) => set({ sessionMinutes: +e.target.value })}>
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n} minutes
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id('goal')}>Daily goal</label>
            <select id={id('goal')} value={s.dailyGoalCards} onChange={(e) => set({ dailyGoalCards: +e.target.value })}>
              {[5, 10, 15, 20, 30].map((n) => (
                <option key={n} value={n}>
                  {n} cards a day
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={id('limit')}>Daily time limit</label>
            <select id={id('limit')} value={s.dailyLimitMinutes} onChange={(e) => set({ dailyLimitMinutes: +e.target.value })}>
              <option value={0}>No limit</option>
              {[15, 20, 30, 45, 60].map((n) => (
                <option key={n} value={n}>
                  {n} minutes a day
                </option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          {toggle('audioAutoplay', "Read spelling words aloud automatically")}
          {toggle('soundEffects', "Sound effects")}
          {toggle('sprintAllowed', "Allow timed Fact Sprint")}
          {toggle('hintsAllowed', "Allow hints")}
          {toggle('typoTolerance', 'Accept one-letter typos (not spelling) with a "Close!" note')}
          <div className="field" style={{ marginTop: 8 }}>
            <label htmlFor={id('rate')}>Reading voice speed</label>
            <select id={id('rate')} value={s.speechRate} onChange={(e) => set({ speechRate: +e.target.value })}>
              <option value={0.7}>Slow</option>
              <option value={0.9}>Normal</option>
              <option value={1.1}>A little faster</option>
            </select>
          </div>
        </div>
        <div style={{ minWidth: 220 }}>
          <div className="field">
            <label htmlFor={id('font')}>Text size</label>
            <select id={id('font')} value={s.fontScale} onChange={(e) => set({ fontScale: +e.target.value })}>
              <option value={1}>Normal</option>
              <option value={1.25}>Large</option>
              <option value={1.5}>Extra large</option>
            </select>
          </div>
          {toggle('dyslexiaFont', "Dyslexia-friendly font")}
          {toggle('extraSpacing', "Extra letter spacing")}
        </div>
      </div>
    </details>
  );
}
