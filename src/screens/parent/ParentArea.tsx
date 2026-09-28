// S-08 Parent area behind the PIN (CS-02): Progress · Decks · Children · Settings.
import { useCallback, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useApp, type Route } from '../../app';
import { db } from '../../db/db';
import { hashPin, newSalt, verifyPin } from '../../lib/pin';
import { PinPad } from '../../ui/common';
import ProgressTab from './ProgressTab';
import DecksTab from './DecksTab';
import ChildrenTab from './ChildrenTab';
import SettingsTab from './SettingsTab';

const TABS = ['Progress', 'Decks', 'Children', 'Settings'] as const;
type Tab = (typeof TABS)[number];

export default function ParentArea({ then }: { then?: Route }) {
  const { parent, go, childId } = useApp();
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [tab, setTab] = useState<Tab>('Progress');
  const [forgot, setForgot] = useState(false);

  const leave = () => go(childId ? { name: 'home' } : { name: 'profiles' });

  const onPin = useCallback(
    async (pin: string) => {
      if (!parent) return;
      if (Date.now() < lockedUntil) return setError('Too many tries. Wait 30 seconds.');
      if (await verifyPin(pin, parent.pinSalt, parent.pinHash)) {
        if (then) return go(then);
        setUnlocked(true);
        setError('');
      } else {
        const f = fails + 1;
        setFails(f);
        if (f >= 5) {
          setLockedUntil(Date.now() + 30_000);
          setFails(0);
          setError('Too many tries. Wait 30 seconds.');
        } else setError("That PIN didn't match. Try again.");
      }
    },
    [parent, then, go, fails, lockedUntil],
  );

  if (!unlocked)
    return (
      <div className="parent">
        <header>
          <button className="btn ghost" onClick={leave}>
            <ChevronLeft aria-hidden /> Back
          </button>
          <h1 style={{ margin: 0, fontSize: '1.2em' }}>Grown-ups only</h1>
        </header>
        <main style={{ maxWidth: 420 }}>
          {forgot ? (
            <ForgotPin onDone={() => setForgot(false)} />
          ) : (
            <div className="panel center stack-gap">
              <PinPad onComplete={onPin} error={error} label="Enter your parent PIN" />
              <button className="btn ghost small" onClick={() => setForgot(true)}>
                Forgot PIN?
              </button>
            </div>
          )}
        </main>
      </div>
    );

  return (
    <div className="parent">
      <header>
        <button className="btn ghost" onClick={leave}>
          <ChevronLeft aria-hidden /> Back to kids
        </button>
        <h1 style={{ margin: 0, fontSize: '1.2em' }}>Grown-ups</h1>
      </header>
      <nav className="tabs" role="tablist" aria-label="Grown-ups sections">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} aria-controls="parent-panel" onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <main id="parent-panel" role="tabpanel" aria-label={tab}>
        {tab === 'Progress' && <ProgressTab />}
        {tab === 'Decks' && <DecksTab />}
        {tab === 'Children' && <ChildrenTab />}
        {tab === 'Settings' && <SettingsTab />}
      </main>
    </div>
  );
}

/** PIN reset guarded by a grown-up math question (keeps kids out; data stays on device). */
function ForgotPin({ onDone }: { onDone: () => void }) {
  const [q] = useState(() => ({ a: 23 + Math.floor(Math.random() * 60), b: 6 + Math.floor(Math.random() * 3) }));
  const [ans, setAns] = useState('');
  const [ok, setOk] = useState(false);
  const [first, setFirst] = useState('');
  const [msg, setMsg] = useState('');
  const onPin = useCallback(
    async (p: string) => {
      if (!first) return setFirst(p);
      if (p !== first) {
        setFirst('');
        return setMsg("Those didn't match. Start again.");
      }
      const salt = newSalt();
      await db.settings.update('parent', { pinSalt: salt, pinHash: await hashPin(p, salt) });
      onDone();
    },
    [first, onDone],
  );
  if (!ok)
    return (
      <form
        className="panel stack-gap"
        onSubmit={(e) => {
          e.preventDefault();
          if (Number(ans) === q.a * q.b) setOk(true);
          else setMsg('Not quite — try again.');
        }}
      >
        <h2>Reset your PIN</h2>
        <div className="field">
          <label htmlFor="gq">
            What is {q.a} × {q.b}?
          </label>
          <input id="gq" type="number" inputMode="numeric" value={ans} onChange={(e) => setAns(e.target.value)} />
        </div>
        {msg && <div className="warn">{msg}</div>}
        <div className="row">
          <button type="button" className="btn ghost" onClick={onDone}>
            Cancel
          </button>
          <button className="btn primary">Continue</button>
        </div>
      </form>
    );
  return (
    <div className="panel center">
      <PinPad key={first ? 'b' : 'a'} onComplete={onPin} label={first ? 'Enter the new PIN again' : 'Choose a new 4-digit PIN'} error={msg} />
    </div>
  );
}
