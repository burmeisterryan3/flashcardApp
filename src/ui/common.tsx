import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Delete } from 'lucide-react';
import { scrambledDigits } from '../lib/pin';

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose?: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input, [tabindex]')?.focus();
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('keydown', esc);
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="backdrop" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={ref}>
        <h2 id="modal-title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export function Confirm({
  title,
  body,
  yes,
  no = 'Cancel',
  onYes,
  onNo,
}: {
  title: string;
  body?: ReactNode;
  yes: string;
  no?: string;
  onYes: () => void;
  onNo: () => void;
}) {
  return (
    <Modal title={title} onClose={onNo}>
      {body && <div style={{ marginBottom: 16 }}>{body}</div>}
      <div className="row end">
        <button className="btn ghost" onClick={onNo}>
          {no}
        </button>
        <button className="btn primary" onClick={onYes}>
          {yes}
        </button>
      </div>
    </Modal>
  );
}

export function ProgressRing({ value, size = 96, children }: { value: number; size?: number; children?: ReactNode }) {
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.35)" strokeWidth="10" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#fff"
          strokeWidth="10"
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>{children}</div>
    </div>
  );
}

/** CS-02: 4-digit PIN with a scrambled keypad. */
export function PinPad({ onComplete, error, label = 'Enter PIN' }: { onComplete: (pin: string) => void; error?: string; label?: string }) {
  const [digits] = useState(() => scrambledDigits());
  const [pin, setPin] = useState('');
  useEffect(() => {
    if (pin.length === 4) {
      onComplete(pin);
      setPin('');
    }
  }, [pin, onComplete]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) setPin((p) => (p.length < 4 ? p + e.key : p));
      if (e.key === 'Backspace') setPin((p) => p.slice(0, -1));
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);
  return (
    <div className="stack-gap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="label" id="pin-label">
        {label}
      </div>
      <div className="row" aria-live="polite" aria-label={`${pin.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{ width: 18, height: 18, borderRadius: 9, border: '2px solid var(--text)', background: i < pin.length ? 'var(--text)' : 'transparent' }}
          />
        ))}
      </div>
      {error && (
        <div className="warn" role="alert">
          {error}
        </div>
      )}
      <div className="numpad" role="group" aria-labelledby="pin-label">
        {digits.slice(0, 9).map((d) => (
          <button key={d} className="btn" onClick={() => setPin((p) => (p.length < 4 ? p + d : p))}>
            {d}
          </button>
        ))}
        <span />
        <button className="btn" onClick={() => setPin((p) => (p.length < 4 ? p + digits[9] : p))}>
          {digits[9]}
        </button>
        <button className="btn" aria-label="Delete" onClick={() => setPin((p) => p.slice(0, -1))}>
          <Delete aria-hidden />
        </button>
      </div>
    </div>
  );
}
