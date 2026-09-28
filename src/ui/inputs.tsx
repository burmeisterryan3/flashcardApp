// Child answer inputs (S-04). Touch targets ≥ 56px (AX-10); full keyboard support (AX-03).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, Delete } from 'lucide-react';
import { letterDiff } from '../engine/answer';
import type { Frac, Mixed } from '../engine/types';
import { speakFrac, speakMixed } from '../engine/fractions';
import { sfx } from '../lib/sfx';

/** Listen for keys while mounted and enabled. */
function useKeys(handler: (e: KeyboardEvent) => void, enabled: boolean) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!enabled) return;
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      ref.current(e);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [enabled]);
}

// ---------------------------------------------------------------- Number pad (CM-03)

export function NumberPad({ onSubmit, disabled, maxLen = 4 }: { onSubmit: (v: string) => void; disabled?: boolean; maxLen?: number }) {
  const [v, setV] = useState('');
  const press = (d: string) => {
    if (disabled) return;
    sfx.tap();
    setV((x) => (x.length >= maxLen ? x : x === '0' ? d : x + d));
  };
  const back = () => !disabled && setV((x) => x.slice(0, -1));
  const submit = () => {
    if (disabled || !v) return;
    onSubmit(v);
  };
  useKeys((e) => {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') submit();
  }, !disabled);
  return (
    <div className="stack-gap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="answer-display" aria-live="polite" aria-label={`Your answer: ${v || 'empty'}`}>
        {v || ' '}
      </div>
      <div className="numpad" role="group" aria-label="Number pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="btn" onClick={() => press(d)} disabled={disabled}>
            {d}
          </button>
        ))}
        <button className="btn" onClick={back} disabled={disabled} aria-label="Delete">
          <Delete aria-hidden />
        </button>
        <button className="btn" onClick={() => press('0')} disabled={disabled}>
          0
        </button>
        <span />
        <button className="btn good check" onClick={submit} disabled={disabled || !v}>
          <Check aria-hidden /> Check
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Fractions

export function FracView({ f, label = true }: { f: Frac; label?: boolean }) {
  return (
    <span className="frac" role={label ? 'img' : undefined} aria-label={label ? speakFrac(f) : undefined}>
      <span aria-hidden>{f.n}</span>
      <span className="bar" aria-hidden />
      <span aria-hidden>{f.d}</span>
    </span>
  );
}

export function MixedView({ m }: { m: Mixed }) {
  if (m.n === 0 || m.d === 0) return <span>{m.w}</span>;
  return (
    <span className="mixed" role="img" aria-label={speakMixed(m)}>
      {m.w > 0 && <span aria-hidden>{m.w}</span>}
      <FracView f={{ n: m.n, d: m.d }} label={false} />
    </span>
  );
}

type Box = 'w' | 'n' | 'd';

/** FR-01: stacked fraction (optionally with a whole-number box) + on-screen pad. */
export function FractionInput({ withWhole, onSubmit, disabled }: { withWhole: boolean; onSubmit: (v: string) => void; disabled?: boolean }) {
  const order: Box[] = withWhole ? ['w', 'n', 'd'] : ['n', 'd'];
  const [vals, setVals] = useState<Record<Box, string>>({ w: '', n: '', d: '' });
  const [active, setActive] = useState<Box>(order[0]);
  const next = () => setActive((a) => order[(order.indexOf(a) + 1) % order.length]);
  const press = (d: string) => {
    if (disabled) return;
    sfx.tap();
    setVals((v) => ({ ...v, [active]: v[active].length >= 3 ? v[active] : v[active] + d }));
  };
  const back = () => {
    if (disabled) return;
    setVals((v) => {
      if (v[active]) return { ...v, [active]: v[active].slice(0, -1) };
      const i = order.indexOf(active);
      if (i > 0) setActive(order[i - 1]);
      return v;
    });
  };
  const value = () => {
    const { w, n, d } = vals;
    if (n && d) return w ? `${w} ${n}/${d}` : `${n}/${d}`;
    if (w && !n && !d) return w;
    if (n && !d && !w) return n; // RF-05 whole number typed on top
    return '';
  };
  const submit = () => {
    const v = value();
    if (!disabled && v) onSubmit(v);
  };
  useKeys((e) => {
    if (/^\d$/.test(e.key)) press(e.key);
    else if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') submit();
    else if (e.key === '/' || e.key === ' ' || e.key === 'Tab') {
      e.preventDefault();
      next();
    }
  }, !disabled);
  const box = (b: Box, name: string) => (
    <button
      type="button"
      className={`frac-box ${active === b ? 'active' : ''}`}
      onClick={() => setActive(b)}
      aria-label={`${name}: ${vals[b] || 'empty'}`}
      aria-pressed={active === b}
      disabled={disabled}
    >
      {vals[b]}
    </button>
  );
  return (
    <div className="stack-gap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="frac-input">
        {withWhole && box('w', 'Whole number')}
        <div className="stack">
          {box('n', 'Top number')}
          <span className="line" aria-hidden />
          {box('d', 'Bottom number')}
        </div>
      </div>
      <div className="numpad" role="group" aria-label="Number pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} className="btn" onClick={() => press(d)} disabled={disabled}>
            {d}
          </button>
        ))}
        <button className="btn" onClick={back} disabled={disabled} aria-label="Delete">
          <Delete aria-hidden />
        </button>
        <button className="btn" onClick={() => press('0')} disabled={disabled}>
          0
        </button>
        <button className="btn" onClick={next} disabled={disabled} aria-label="Next box">
          <ArrowRight aria-hidden />
        </button>
        <button className="btn good check" onClick={submit} disabled={disabled || !value()}>
          <Check aria-hidden /> Check
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Multiple choice

export function Choices({
  options,
  onPick,
  picked,
  correct,
  render,
}: {
  options: string[];
  onPick: (o: string) => void;
  /** once set, the grid is locked (edge case: rapid taps) */
  picked?: string;
  /** show which is right after answering */
  correct?: string;
  render?: (o: string) => ReactNode;
}) {
  const locked = picked !== undefined;
  useKeys((e) => {
    const i = Number(e.key) - 1;
    if (i >= 0 && i < options.length) onPick(options[i]);
  }, !locked);
  return (
    <div className={`choices n${options.length}`} role="group" aria-label="Answer choices">
      {options.map((o, i) => {
        const cls = locked && o === correct ? 'is-right' : locked && o === picked ? 'is-picked-wrong' : '';
        return (
          <button key={o} className={`btn choice ${cls}`} onClick={() => !locked && onPick(o)} aria-disabled={locked} aria-keyshortcuts={String(i + 1)}>
            <span className="key" aria-hidden>
              {i + 1}
            </span>
            {render ? render(o) : o}
            {locked && o === correct && <Check aria-label="correct answer" style={{ marginLeft: 'auto' }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------- Typing

export function TextAnswer({
  onSubmit,
  disabled,
  label,
  autoFocus = true,
  resetKey,
}: {
  onSubmit: (v: string) => void;
  disabled?: boolean;
  label: string;
  autoFocus?: boolean;
  resetKey?: unknown;
}) {
  const [v, setV] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setV('');
    if (autoFocus) ref.current?.focus();
  }, [resetKey, autoFocus]);
  return (
    <form
      className="row"
      style={{ justifyContent: 'center', width: '100%' }}
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim() && !disabled) onSubmit(v);
      }}
    >
      <input
        ref={ref}
        className="answer-input"
        value={v}
        onChange={(e) => setV(e.target.value)}
        aria-label={label}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="done"
        disabled={disabled}
      />
      <button className="btn good big" disabled={disabled || !v.trim()}>
        <Check aria-hidden /> Check
      </button>
    </form>
  );
}

/** CS-05: letter-by-letter comparison with non-color marks (strike / underline). */
export function LetterDiff({ given, answer }: { given: string; answer: string }) {
  const d = letterDiff(given, answer);
  return (
    <div className="stack-gap center" aria-label={`You wrote ${given.split('').join(' ')}. The word is ${answer.split('').join(' ')}.`} role="group">
      <div className="muted" aria-hidden>
        You wrote
      </div>
      <div className="diff" aria-hidden>
        {d.given.map((c, i) => (
          <span key={i} className={c.status}>
            {c.ch}
          </span>
        ))}
      </div>
      <div className="muted" aria-hidden>
        The word is
      </div>
      <div className="diff" aria-hidden>
        {d.answer.map((c, i) => (
          <span key={i} className={c.status}>
            {c.ch}
          </span>
        ))}
      </div>
    </div>
  );
}
