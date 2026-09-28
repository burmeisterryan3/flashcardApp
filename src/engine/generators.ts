// Math fact & fraction generators (CM-02, CF/RF/IF). Card IDs are stable so progress
// survives regenerating a deck with the same settings.
import type { Card, FractionConfig, Frac, MathConfig, MathOp } from './types';
import { compareFrac, fracStr, gcd, mixedStr, simplify, speakFrac, speakMixed, toImproper, toMixed } from './fractions';

const SYM: Record<MathOp, string> = { add: '+', sub: '−', mul: '×', div: '÷' };
export const OP_SYMBOL = SYM;

function mathCard(deckId: string, op: MathOp, a: number, b: number, answer: number): Card {
  return {
    id: `${deckId}|math:${op}:${a}x${b}`,
    deckId,
    kind: 'math',
    prompt: { text: `${a} ${SYM[op]} ${b} = ?` },
    answer: String(answer),
    alternates: [],
    tags: [op],
    data: { a, b, op },
    group: op,
    hint: mathHint(op, a, b),
  };
}

function mathHint(op: MathOp, a: number, b: number): string {
  switch (op) {
    case 'add':
      return a >= 5 || b >= 5 ? `Start at ${Math.max(a, b)} and count up ${Math.min(a, b)}.` : `Count up from ${a}.`;
    case 'sub':
      return `What plus ${b} makes ${a}?`;
    case 'mul':
      return `${a} groups of ${b}.`;
    case 'div':
      return `What times ${b} makes ${a}?`;
  }
}

/** CM-02: no negatives, no ÷0, whole-number division only. */
export function generateMathCards(deckId: string, cfg: MathConfig): Card[] {
  const out: Card[] = [];
  const seen = new Set<string>();
  const push = (c: Card) => {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  };
  // Keep "facts to 100" decks a sensible size: tens-friendly pairs only.
  const addPairs = (): Array<[number, number]> => {
    const pairs: Array<[number, number]> = [];
    if (cfg.maxSum <= 20) {
      // Facts to 10 / 20: single addends 0–10.
      for (let a = 0; a <= 10; a++)
        for (let b = 0; b <= 10; b++) if (a + b <= cfg.maxSum) pairs.push([a, b]);
    } else {
      for (let a = 10; a <= 90; a += 10) for (let b = 1; b <= 9; b++) pairs.push([a, b]);
      for (let a = 10; a <= 90; a += 10) for (let b = 10; a + b <= 100; b += 10) pairs.push([a, b]);
      for (let a = 11; a <= 89; a += 7) for (let b = 3; b <= 9; b += 3) pairs.push([a, b]);
    }
    return pairs;
  };
  for (const op of cfg.ops) {
    if (op === 'add') for (const [a, b] of addPairs()) push(mathCard(deckId, 'add', a, b, a + b));
    if (op === 'sub') for (const [x, b] of addPairs()) push(mathCard(deckId, 'sub', x + b, b, x));
    if (op === 'mul') for (const t of cfg.tables) for (let b = 0; b <= 10; b++) push(mathCard(deckId, 'mul', t, b, t * b));
    if (op === 'div')
      for (const t of cfg.tables) {
        if (t === 0) continue; // never divide by 0
        for (let q = 0; q <= 10; q++) push(mathCard(deckId, 'div', t * q, t, q));
      }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Fractions

const fracLabel = (f: Frac) => `${f.n}/${f.d}`;

function compareCard(deckId: string, f1: Frac, f2: Frac, level: string): Card {
  const c = compareFrac(f1, f2);
  const ans = c < 0 ? '<' : c > 0 ? '>' : '=';
  let reason: string;
  if (c === 0) reason = 'They cover the same amount, so they are equal.';
  else if (f1.d === f2.d) reason = 'Same bottom number, so the bigger top number is bigger.';
  else if (f1.n === f2.n) reason = 'Same top number, so the smaller bottom number means bigger pieces.';
  else reason = 'Picture both bars — which one is shaded more?';
  return {
    id: `${deckId}|frac:cmp:${fracLabel(f1)}:${fracLabel(f2)}`,
    deckId,
    kind: 'frac-compare',
    prompt: { text: `Compare ${speakFrac(f1)} and ${speakFrac(f2)}` },
    answer: ans,
    alternates: [],
    tags: ['compare', level],
    data: { f1, f2 },
    hint:
      f1.d === f2.d
        ? 'The bottom numbers match. Look at the top numbers.'
        : f1.n === f2.n
          ? 'The top numbers match. Fewer pieces means bigger pieces.'
          : 'Try the fraction bars to see which is bigger.',
    exampleSentence: reason,
  };
}

export function generateFractionCards(deckId: string, cfg: FractionConfig): Card[] {
  const out: Card[] = [];
  const ids = new Set<string>();
  const push = (c: Card) => {
    if (!ids.has(c.id)) {
      ids.add(c.id);
      out.push(c);
    }
  };

  if (cfg.skill === 'compare') {
    const levels = cfg.compareLevels?.length ? cfg.compareLevels : ['same-d', 'same-n'];
    if (levels.includes('same-d'))
      for (const d of [2, 3, 4, 6, 8]) for (let a = 1; a < d; a++) for (let b = 1; b < d; b++) if (a !== b && (a + b + d) % 2 === 0) push(compareCard(deckId, { n: a, d }, { n: b, d }, 'same-d'));
    if (levels.includes('same-n'))
      for (const n of [1, 2, 3]) for (const d1 of [2, 3, 4, 6, 8]) for (const d2 of [2, 3, 4, 6, 8]) if (d1 !== d2 && n < d1 && n < d2 && (d1 + d2) % 3 !== 0) push(compareCard(deckId, { n, d: d1 }, { n, d: d2 }, 'same-n'));
    if (levels.includes('unlike')) {
      const ds = [2, 3, 4, 6, 8, 10, 12];
      for (const d1 of ds)
        for (const d2 of ds)
          if (d1 < d2)
            for (let a = 1; a < d1; a++) {
              const b = Math.max(1, Math.round((a / d1) * d2) + ((a + d2) % 3) - 1);
              if (b < d2 && b !== a) push(compareCard(deckId, { n: a, d: d1 }, { n: b, d: d2 }, 'unlike'));
            }
    }
    // Equal pairs ~1 in 6 (CF-02).
    const nonEqual = out.length;
    const equals: Array<[Frac, Frac]> = [];
    for (const base of [{ n: 1, d: 2 }, { n: 1, d: 3 }, { n: 2, d: 3 }, { n: 1, d: 4 }, { n: 3, d: 4 }, { n: 1, d: 5 }])
      for (const k of [2, 3, 4]) if (base.d * k <= 12) equals.push([base, { n: base.n * k, d: base.d * k }]);
    const wantEq = Math.max(2, Math.round(nonEqual / 5));
    equals.slice(0, wantEq).forEach(([a, b], i) => push(compareCard(deckId, i % 2 ? a : b, i % 2 ? b : a, 'equal')));
  }

  if (cfg.skill === 'reduce') {
    for (let d = 2; d <= 12; d++)
      for (let n = 1; n <= d; n++) {
        const base = { n, d };
        if (gcd(n, d) !== 1 && n !== d) continue;
        for (let k = 2; k <= 6; k++) {
          const f = { n: n * k, d: d * k };
          if (f.d > 60) continue;
          // Keep deck to a practical size: every base once with 2 multipliers.
          if ((n + d + k) % 2 !== 0 && n !== d) continue;
          push(reduceCard(deckId, f));
        }
      }
    if (cfg.includeSimplest)
      for (const f of [{ n: 3, d: 4 }, { n: 2, d: 5 }, { n: 5, d: 7 }, { n: 3, d: 8 }, { n: 7, d: 10 }, { n: 5, d: 12 }])
        push(reduceCard(deckId, f));
  }

  if (cfg.skill === 'improper') {
    const dirs = cfg.directions?.length ? cfg.directions : ['to-mixed'];
    for (let d = 2; d <= 10; d++)
      for (let w = 1; w <= 5; w++)
        for (let r = 0; r < d; r++) {
          // Sample: keep all wholes for small d, and a spread of remainders.
          if ((w + r + d) % 3 !== 0 && r !== 0) continue;
          if (r === 0 && w > 3) continue;
          const f = { n: w * d + r, d };
          if (dirs.includes('to-mixed')) push(toMixedCard(deckId, f));
          if (dirs.includes('to-improper') && r > 0 && gcd(r, d) === 1) push(toImproperCard(deckId, { w, n: r, d }));
        }
  }
  return out;
}

function reduceCard(deckId: string, f: Frac): Card {
  const s = simplify(f);
  const g = gcd(f.n, f.d);
  return {
    id: `${deckId}|frac:red:${fracLabel(f)}`,
    deckId,
    kind: 'frac-reduce',
    prompt: { text: `Write ${speakFrac(f)} in simplest form` },
    answer: fracStr(s),
    alternates: [],
    tags: ['reduce'],
    data: { f1: f },
    hint: g > 1 ? `Both numbers can be divided by ${g}.` : 'This one is already as simple as it gets!',
    exampleSentence: g > 1 ? `${f.n} ÷ ${g} = ${s.n} and ${f.d} ÷ ${g} = ${s.d}` : undefined,
  };
}

function toMixedCard(deckId: string, f: Frac): Card {
  const m = toMixed(f);
  return {
    id: `${deckId}|frac:mix:${fracLabel(f)}`,
    deckId,
    kind: 'frac-to-mixed',
    prompt: { text: `Write ${speakFrac(f)} as a ${m.n === 0 ? 'whole' : 'mixed'} number` },
    answer: mixedStr(m),
    alternates: [],
    tags: ['improper', 'to-mixed'],
    data: { f1: f },
    hint: `How many groups of ${f.d} fit into ${f.n}?`,
    exampleSentence: `${f.n} ÷ ${f.d} = ${Math.floor(f.n / f.d)} remainder ${f.n % f.d}`,
  };
}

function toImproperCard(deckId: string, m: { w: number; n: number; d: number }): Card {
  const f = toImproper(m);
  return {
    id: `${deckId}|frac:imp:${m.w}_${m.n}/${m.d}`,
    deckId,
    kind: 'mixed-to-improper',
    prompt: { text: `Write ${speakMixed(m)} as an improper fraction` },
    answer: fracStr(f),
    alternates: [],
    tags: ['improper', 'to-improper'],
    data: { mixed: m },
    hint: `Each whole is ${m.d}/${m.d}. ${m.w} × ${m.d} = ${m.w * m.d}, then add ${m.n}.`,
    exampleSentence: `${m.w} × ${m.d} + ${m.n} = ${f.n}, so ${f.n}/${f.d}`,
  };
}

/** Plain-text preview for parent screens. */
export function describeCard(c: Card): string {
  const d = c.data;
  if (c.kind === 'frac-compare' && d?.f1 && d.f2) return `${fracLabel(d.f1)}  ?  ${fracLabel(d.f2)}`;
  if ((c.kind === 'frac-reduce' || c.kind === 'frac-to-mixed') && d?.f1) return `${fracLabel(d.f1)} → ${c.answer}`;
  if (c.kind === 'mixed-to-improper' && d?.mixed) return `${mixedStr(d.mixed)} → ${c.answer}`;
  if (c.kind === 'math') return `${c.prompt.text?.replace('?', c.answer)}`;
  if (c.kind === 'spell') return c.answer;
  return `${c.prompt.text ?? '(picture)'} → ${c.answer}`;
}
