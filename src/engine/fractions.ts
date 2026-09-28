import type { Frac, Mixed } from './types';

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function simplify(f: Frac): Frac {
  const g = gcd(f.n, f.d);
  return { n: f.n / g, d: f.d / g };
}

export function isSimplest(f: Frac): boolean {
  return gcd(f.n, f.d) === 1;
}

/** -1 if a<b, 0 if equal, 1 if a>b (exact integer cross-multiplication). */
export function compareFrac(a: Frac, b: Frac): -1 | 0 | 1 {
  const l = a.n * b.d;
  const r = b.n * a.d;
  return l < r ? -1 : l > r ? 1 : 0;
}

export function toMixed(f: Frac): Mixed {
  const w = Math.floor(f.n / f.d);
  const rem = simplify({ n: f.n % f.d, d: f.d });
  return { w, n: f.n % f.d === 0 ? 0 : rem.n, d: f.n % f.d === 0 ? 0 : rem.d };
}

export function toImproper(m: Mixed): Frac {
  return { n: m.w * m.d + m.n, d: m.d };
}

/** Canonical string forms used for stored answers: "3/4", "2 1/2", "3". */
export function fracStr(f: Frac): string {
  return f.d === 1 ? String(f.n) : `${f.n}/${f.d}`;
}

export function mixedStr(m: Mixed): string {
  if (m.n === 0) return String(m.w);
  if (m.w === 0) return `${m.n}/${m.d}`;
  return `${m.w} ${m.n}/${m.d}`;
}

/** Parse "3/4", "2 1/2", "3". Returns null for bad input or zero denominator (FR-02). */
export function parseMixed(s: string): Mixed | null {
  const t = s.trim().replace(/\s+/g, ' ');
  let m = t.match(/^(\d+)$/);
  if (m) return { w: +m[1], n: 0, d: 0 };
  m = t.match(/^(\d+)\/(\d+)$/);
  if (m) return +m[2] === 0 ? null : { w: 0, n: +m[1], d: +m[2] };
  m = t.match(/^(\d+) (\d+)\/(\d+)$/);
  if (m) return +m[3] === 0 ? null : { w: +m[1], n: +m[2], d: +m[3] };
  return null;
}

/** Value of a mixed number as an (unsimplified) fraction. */
export function mixedValue(m: Mixed): Frac {
  if (m.d === 0) return { n: m.w, d: 1 };
  return { n: m.w * m.d + m.n, d: m.d };
}

const ORD: Record<number, [string, string]> = {
  2: ['half', 'halves'],
  3: ['third', 'thirds'],
  4: ['fourth', 'fourths'],
  5: ['fifth', 'fifths'],
  6: ['sixth', 'sixths'],
  7: ['seventh', 'sevenths'],
  8: ['eighth', 'eighths'],
  9: ['ninth', 'ninths'],
  10: ['tenth', 'tenths'],
  11: ['eleventh', 'elevenths'],
  12: ['twelfth', 'twelfths'],
};

/** Spoken form for screen readers and TTS: 3/4 → "3 fourths", 1/2 → "1 half". */
export function speakFrac(f: Frac): string {
  if (f.d === 1) return String(f.n);
  const o = ORD[f.d];
  if (!o) return `${f.n} over ${f.d}`;
  return `${f.n} ${f.n === 1 ? o[0] : o[1]}`;
}

export function speakMixed(m: Mixed): string {
  if (m.n === 0 || m.d === 0) return String(m.w);
  if (m.w === 0) return speakFrac({ n: m.n, d: m.d });
  return `${m.w} and ${speakFrac({ n: m.n, d: m.d })}`;
}
