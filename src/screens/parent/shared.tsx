import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { db } from '../../db/db';
import type { ChildProfile } from '../../engine/types';
import { Avatar } from '../../ui/art';

export function useChildren(): ChildProfile[] {
  return (useLiveQuery(() => db.children.toArray(), []) ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export function ChildPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const kids = useChildren();
  useEffect(() => {
    if (!value && kids[0]) onChange(kids[0].id);
  }, [kids, value, onChange]);
  if (kids.length < 2) return null;
  return (
    <div className="row" role="radiogroup" aria-label="Choose child" style={{ marginBottom: 12 }}>
      {kids.map((k) => (
        <button key={k.id} role="radio" aria-checked={value === k.id} className={`btn ${value === k.id ? 'primary' : 'ghost'}`} onClick={() => onChange(k.id)}>
          <Avatar id={k.avatarId} size={28} /> {k.name}
        </button>
      ))}
    </div>
  );
}

export function MasteryBar({ m, l, g, n }: { m: number; g: number; l: number; n: number }) {
  const t = m + g + l + n || 1;
  return (
    <div className="mbar" role="img" aria-label={`${m} mastered, ${g} getting there, ${l} learning, ${n} not started`}>
      <span className="m" style={{ width: `${(m / t) * 100}%` }} />
      <span className="g" style={{ width: `${(g / t) * 100}%` }} />
      <span className="l" style={{ width: `${(l / t) * 100}%` }} />
    </div>
  );
}

export const fmtDate = (t: number) => (t ? new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—');
