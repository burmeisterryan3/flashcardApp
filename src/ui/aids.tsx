// Visual aids on request (CM-06, CF-03, IF-05). Pictures only — they never print the answer.
import type { Card } from '../engine/types';

function TenFrames({ a, b }: { a: number; b: number }) {
  const total = Math.max(a + b, 10);
  const frames = Math.ceil(total / 10);
  const dots = Array.from({ length: frames * 10 }, (_, i) => (i < a ? 'a' : i < a + b ? 'b' : 'empty'));
  return (
    <div className="aid" role="img" aria-label={`Ten frames showing ${a} and ${b} more`}>
      {Array.from({ length: frames }, (_, f) => (
        <div key={f} className="tenframe">
          {dots.slice(f * 10, f * 10 + 10).map((d, i) => (
            <span key={i} className={`dot ${d === 'b' ? 'b' : d === 'empty' ? 'empty' : ''}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

function TakeAway({ a, b }: { a: number; b: number }) {
  return (
    <div className="aid" role="img" aria-label={`${a} dots with ${b} crossed out`}>
      <div className="dots" style={{ gridTemplateColumns: 'repeat(10, 18px)' }}>
        {Array.from({ length: a }, (_, i) => (
          <span key={i} className={`dot ${i >= a - b ? 'x' : ''}`} />
        ))}
      </div>
    </div>
  );
}

function ArrayDots({ rows, cols, label }: { rows: number; cols: number; label: string }) {
  if (rows === 0 || cols === 0) return <p className="muted">Zero groups means zero!</p>;
  return (
    <div className="aid" role="img" aria-label={label}>
      <div className="dots" style={{ gridTemplateColumns: `repeat(${cols}, 18px)` }}>
        {Array.from({ length: rows * cols }, (_, i) => (
          <span key={i} className="dot" />
        ))}
      </div>
    </div>
  );
}

export function FracBar({ n, d }: { n: number; d: number }) {
  return (
    <div className="fbar" role="img" aria-label={`A bar cut into ${d} equal parts with ${n} shaded`}>
      {Array.from({ length: d }, (_, i) => (
        <span key={i} className={i < n ? 'on' : ''} />
      ))}
    </div>
  );
}

function Circles({ n, d }: { n: number; d: number }) {
  const count = Math.ceil(n / d);
  const r = 34;
  return (
    <div className="aid" role="img" aria-label={`${count} circles, each cut into ${d} pieces, with ${n} pieces shaded`}>
      {Array.from({ length: count }, (_, c) => {
        const shaded = Math.min(d, n - c * d);
        return (
          <svg key={c} width="80" height="80" viewBox="-40 -40 80 80" aria-hidden>
            {Array.from({ length: d }, (_, i) => {
              const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
              const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
              const large = a1 - a0 > Math.PI ? 1 : 0;
              const p = d === 1
                ? `M ${-r} 0 A ${r} ${r} 0 1 1 ${r} 0 A ${r} ${r} 0 1 1 ${-r} 0`
                : `M0 0 L ${r * Math.cos(a0)} ${r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${r * Math.cos(a1)} ${r * Math.sin(a1)} Z`;
              return <path key={i} d={p} fill={i < shaded ? 'var(--fractions)' : 'var(--surface)'} stroke="var(--text)" strokeWidth="2" />;
            })}
          </svg>
        );
      })}
    </div>
  );
}

export function hasAid(card: Card): boolean {
  const d = card.data;
  if (card.kind === 'math' && d) {
    if (d.op === 'add') return (d.a ?? 0) + (d.b ?? 0) <= 20;
    if (d.op === 'sub') return (d.a ?? 0) <= 20;
    if (d.op === 'mul') return (d.a ?? 0) <= 12 && (d.b ?? 0) <= 12;
    if (d.op === 'div') return (d.a ?? 0) <= 100;
  }
  return card.kind.startsWith('frac') || card.kind === 'mixed-to-improper';
}

export function VisualAid({ card }: { card: Card }) {
  const d = card.data ?? {};
  if (card.kind === 'math') {
    const a = d.a ?? 0;
    const b = d.b ?? 0;
    if (d.op === 'add') return <TenFrames a={a} b={b} />;
    if (d.op === 'sub') return <TakeAway a={a} b={b} />;
    if (d.op === 'mul') return <ArrayDots rows={a} cols={b} label={`${a} rows of ${b} dots`} />;
    if (d.op === 'div') return <ArrayDots rows={b} cols={b ? a / b : 0} label={`${a} dots shared into ${b} equal rows`} />;
  }
  if (card.kind === 'frac-compare' && d.f1 && d.f2)
    return (
      <div className="aid" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <FracBar {...d.f1} />
        <FracBar {...d.f2} />
      </div>
    );
  if (card.kind === 'frac-reduce' && d.f1) return <div className="aid"><FracBar {...d.f1} /></div>;
  if (card.kind === 'frac-to-mixed' && d.f1) return <Circles n={d.f1.n} d={d.f1.d} />;
  if (card.kind === 'mixed-to-improper' && d.mixed) return <Circles n={d.mixed.w * d.mixed.d + d.mixed.n} d={d.mixed.d} />;
  return null;
}
