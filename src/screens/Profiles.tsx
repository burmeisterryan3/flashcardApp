// S-01 Profile picker (WF-02 step 1, WF-11).
import { useLiveQuery } from 'dexie-react-hooks';
import { Lock } from 'lucide-react';
import { ChildScreen, useApp } from '../app';
import { db } from '../db/db';
import { Avatar, Owl } from '../ui/art';

export default function Profiles() {
  const { go, setChildId } = useApp();
  const kids = useLiveQuery(() => db.children.orderBy('id').toArray(), []) ?? [];
  const sorted = [...kids].sort((a, b) => a.createdAt - b.createdAt);
  return (
    <ChildScreen>
      <div className="topbar">
        <span className="spacer" />
        <button className="btn ghost small" onClick={() => go({ name: 'parent' })} aria-label="Grown-ups area">
          <Lock size={18} aria-hidden /> Grown-ups
        </button>
      </div>
      <main className="child-main center">
        <Owl size={110} label="Hoot the owl" />
        <h1>Who's practicing?</h1>
        <div className="row" style={{ justifyContent: 'center', gap: 24, marginTop: 16 }}>
          {sorted.map((k) => (
            <button
              key={k.id}
              className="btn ghost"
              style={{ flexDirection: 'column', padding: 16, minWidth: 150, fontSize: '1.2em' }}
              onClick={() => {
                setChildId(k.id);
                go({ name: 'home' });
              }}
            >
              <Avatar id={k.avatarId} size={96} />
              {k.name}
            </button>
          ))}
        </div>
      </main>
    </ChildScreen>
  );
}
