// Original illustrations: Hoot the owl mascot (D-11), avatars (CS-06: no photos), subject icons.
import { BookOpen, Calculator, Globe, Pencil, PieChart, Star } from 'lucide-react';
import type { Subject } from '../content/catalog';

export type OwlMood = 'happy' | 'cheer' | 'think';

export function Owl({ size = 96, mood = 'happy', label }: { size?: number; mood?: OwlMood; label?: string }) {
  const look = mood === 'think' ? -3 : 0;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} className={mood === 'cheer' ? 'celebrate' : undefined}>
      {/* ear tufts */}
      <path d="M30 30 L38 8 L50 26 Z" fill="#5b3fb8" />
      <path d="M90 30 L82 8 L70 26 Z" fill="#5b3fb8" />
      {/* wings */}
      {mood === 'cheer' ? (
        <>
          <path d="M22 62 Q4 40 10 22 Q24 40 32 56 Z" fill="#5b3fb8" />
          <path d="M98 62 Q116 40 110 22 Q96 40 88 56 Z" fill="#5b3fb8" />
        </>
      ) : (
        <>
          <path d="M20 58 Q6 80 22 100 Q28 78 30 62 Z" fill="#5b3fb8" />
          <path d="M100 58 Q114 80 98 100 Q92 78 90 62 Z" fill="#5b3fb8" />
        </>
      )}
      {/* body */}
      <ellipse cx="60" cy="66" rx="40" ry="46" fill="#7b5ce6" />
      <ellipse cx="60" cy="82" rx="24" ry="26" fill="#f6e7c8" />
      {[70, 80, 90].map((y) => (
        <path key={y} d={`M50 ${y} q5 4 10 0 q5 4 10 0`} stroke="#d9c196" strokeWidth="2" fill="none" />
      ))}
      {/* eyes */}
      <circle cx="44" cy="46" r="16" fill="#fff" />
      <circle cx="76" cy="46" r="16" fill="#fff" />
      <circle cx="44" cy={46 + look} r="8" fill="#1f2340" />
      <circle cx="76" cy={46 + look} r="8" fill="#1f2340" />
      <circle cx="47" cy={43 + look} r="2.5" fill="#fff" />
      <circle cx="79" cy={43 + look} r="2.5" fill="#fff" />
      {/* beak */}
      <path d="M54 58 L66 58 L60 68 Z" fill="#f5b400" />
      {/* feet */}
      <path d="M46 110 l-4 6 M50 110 l0 7 M54 110 l4 6 M66 110 l-4 6 M70 110 l0 7 M74 110 l4 6" stroke="#f5b400" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

interface AvatarDef {
  id: string;
  name: string;
  color: string;
  ears: 'round' | 'point' | 'long' | 'none' | 'antenna';
  face: string;
}

export const AVATARS: AvatarDef[] = [
  { id: 'bear', name: 'Bear', color: '#a0673a', ears: 'round', face: '#e8c39e' },
  { id: 'cat', name: 'Cat', color: '#f08a24', ears: 'point', face: '#ffe0bf' },
  { id: 'bunny', name: 'Bunny', color: '#b9b3c9', ears: 'long', face: '#f4eff9' },
  { id: 'frog', name: 'Frog', color: '#3aa35b', ears: 'none', face: '#c8f0cf' },
  { id: 'panda', name: 'Panda', color: '#2e2e3a', ears: 'round', face: '#ffffff' },
  { id: 'fox', name: 'Fox', color: '#d9541e', ears: 'point', face: '#fff3e6' },
  { id: 'robot', name: 'Robot', color: '#4a7bd9', ears: 'antenna', face: '#dce8ff' },
  { id: 'koala', name: 'Koala', color: '#8b8fa3', ears: 'round', face: '#e3e5ee' },
];

export function Avatar({ id, size = 64 }: { id: string; size?: number }) {
  const a = AVATARS.find((x) => x.id === id) ?? AVATARS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="50" fill={a.face} opacity="0.35" />
      {a.ears === 'round' && (
        <>
          <circle cx="24" cy="28" r="13" fill={a.color} />
          <circle cx="76" cy="28" r="13" fill={a.color} />
        </>
      )}
      {a.ears === 'point' && (
        <>
          <path d="M16 44 L22 10 L42 26 Z" fill={a.color} />
          <path d="M84 44 L78 10 L58 26 Z" fill={a.color} />
        </>
      )}
      {a.ears === 'long' && (
        <>
          <ellipse cx="36" cy="18" rx="8" ry="20" fill={a.color} />
          <ellipse cx="64" cy="18" rx="8" ry="20" fill={a.color} />
        </>
      )}
      {a.ears === 'antenna' && (
        <>
          <line x1="50" y1="22" x2="50" y2="6" stroke={a.color} strokeWidth="4" />
          <circle cx="50" cy="6" r="5" fill="#f5b400" />
        </>
      )}
      {a.ears === 'antenna' ? <rect x="20" y="22" width="60" height="56" rx="14" fill={a.color} /> : <circle cx="50" cy="54" r="32" fill={a.color} />}
      <ellipse cx="50" cy="62" rx="20" ry="15" fill={a.face} />
      {a.ears === 'none' ? (
        <>
          <circle cx="36" cy="30" r="10" fill={a.color} />
          <circle cx="64" cy="30" r="10" fill={a.color} />
          <circle cx="36" cy="30" r="5" fill="#1f2340" />
          <circle cx="64" cy="30" r="5" fill="#1f2340" />
        </>
      ) : (
        <>
          <circle cx="39" cy="46" r="5" fill={a.id === 'panda' ? '#fff' : '#1f2340'} />
          <circle cx="61" cy="46" r="5" fill={a.id === 'panda' ? '#fff' : '#1f2340'} />
          {a.id === 'panda' && (
            <>
              <circle cx="39" cy="46" r="2.5" fill="#1f2340" />
              <circle cx="61" cy="46" r="2.5" fill="#1f2340" />
            </>
          )}
        </>
      )}
      <ellipse cx="50" cy="58" rx="5" ry="3.5" fill="#1f2340" />
      <path d="M43 66 Q50 72 57 66" stroke="#1f2340" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function SubjectIcon({ icon, size = 28 }: { icon: Subject['icon']; size?: number }) {
  const p = { size, 'aria-hidden': true, strokeWidth: 2.4 } as const;
  switch (icon) {
    case 'spelling':
      return <Pencil {...p} />;
    case 'math':
      return <Calculator {...p} />;
    case 'fractions':
      return <PieChart {...p} />;
    case 'geography':
      return <Globe {...p} />;
    case 'reading':
      return <BookOpen {...p} />;
    default:
      return <Star {...p} />;
  }
}
