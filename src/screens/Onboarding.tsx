// WF-01 First launch (parent setup): welcome → PIN ×2 → children → subjects & decks → done.
import { useCallback, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { useApp } from '../app';
import { db, seedBuiltins, uid } from '../db/db';
import { BUILTINS, CONTENT_VERSION, SUBJECTS, suggestedDecks, suggestedSubjects } from '../content/catalog';
import { DEFAULT_CHILD_SETTINGS, type ChildProfile, type SubjectId } from '../engine/types';
import { newRewards } from '../engine/rewards';
import { hashPin, newSalt } from '../lib/pin';
import { ttsAvailable } from '../lib/speech';
import { AVATARS, Avatar, Owl } from '../ui/art';
import { PinPad } from '../ui/common';

export const GRADES = ['Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'];

interface Plan {
  subjects: SubjectId[];
  decks: string[];
}

export default function Onboarding() {
  const { go, setChildId } = useApp();
  const [step, setStep] = useState<'welcome' | 'pin' | 'pin2' | 'child' | 'more' | 'plan'>('welcome');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [kids, setKids] = useState<ChildProfile[]>([]);
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [busy, setBusy] = useState(false);

  const onPin1 = useCallback((p: string) => {
    setPin(p);
    setPinError('');
    setStep('pin2');
  }, []);
  const onPin2 = useCallback(
    (p: string) => {
      if (p !== pin) {
        setPinError("Those PINs didn't match. Let's try again.");
        setStep('pin');
      } else setStep('child');
    },
    [pin],
  );

  const addChild = (c: ChildProfile) => {
    setKids((k) => [...k, c]);
    const subjects = suggestedSubjects(c.grade);
    setPlans((p) => ({ ...p, [c.id]: { subjects, decks: suggestedDecks(c.grade, subjects) } }));
    setStep('more');
  };

  const finish = async (useDefaults = false) => {
    setBusy(true);
    const salt = newSalt();
    const assign: Record<string, string[]> = {};
    for (const k of kids) {
      const plan = useDefaults
        ? { subjects: suggestedSubjects(k.grade), decks: suggestedDecks(k.grade, suggestedSubjects(k.grade)) }
        : plans[k.id];
      for (const key of plan.decks) (assign[key] ??= []).push(k.id);
    }
    await db.children.bulkPut(kids);
    await db.rewards.bulkPut(kids.map((k) => newRewards(k.id)));
    await seedBuiltins(assign);
    await db.settings.put({
      id: 'parent',
      pinHash: await hashPin(pin, salt),
      pinSalt: salt,
      theme: 'system',
      requirePinToSwitch: false,
      onboarded: true,
      ttsUnavailable: !ttsAvailable(),
      contentVersion: CONTENT_VERSION,
    });
    if (kids.length === 1) {
      setChildId(kids[0].id);
      go({ name: 'home' });
    } else go({ name: 'profiles' });
  };

  return (
    <div className="parent">
      <main style={{ maxWidth: 640 }}>
        {step === 'welcome' && (
          <div className="center stack-gap" style={{ paddingTop: 40 }}>
            <Owl size={140} mood="cheer" label="Hoot the owl waving hello" />
            <h1>Welcome to Hoot Flash Cards</h1>
            <p className="muted">This app is set up by a grown-up. It takes about two minutes.</p>
            <button className="btn primary big" onClick={() => setStep('pin')}>
              Get started
            </button>
          </div>
        )}

        {(step === 'pin' || step === 'pin2') && (
          <div className="panel center stack-gap">
            <h1>{step === 'pin' ? 'Create a parent PIN' : 'Enter the PIN again'}</h1>
            <p className="muted">The PIN keeps settings and your decks in a grown-ups-only area.</p>
            <PinPad key={step} label={step === 'pin' ? 'Choose 4 digits' : 'Confirm your 4 digits'} onComplete={step === 'pin' ? onPin1 : onPin2} error={pinError} />
          </div>
        )}

        {step === 'child' && <ChildForm onSave={addChild} title={kids.length ? 'Add another child' : 'Add your child'} />}

        {step === 'more' && (
          <div className="panel stack-gap">
            <h1>Children</h1>
            {kids.map((k) => (
              <div key={k.id} className="row">
                <Avatar id={k.avatarId} size={48} />
                <b>{k.name}</b> <span className="muted">{GRADES[k.grade]}</span>
              </div>
            ))}
            <div className="row">
              {kids.length < 4 && (
                <button className="btn ghost" onClick={() => setStep('child')}>
                  <Plus aria-hidden /> Add another child
                </button>
              )}
              <button className="btn primary" onClick={() => setStep('plan')}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 'plan' && (
          <div className="stack-gap">
            <h1>Pick subjects and starting decks</h1>
            <p className="muted">We've checked what fits each grade. You can change this any time in the grown-ups area.</p>
            {kids.map((k) => (
              <PlanEditor key={k.id} child={k} plan={plans[k.id]} onChange={(p) => setPlans((all) => ({ ...all, [k.id]: p }))} />
            ))}
            <div className="row end">
              <button className="btn ghost" onClick={() => finish(true)} disabled={busy}>
                Skip — use suggestions
              </button>
              <button className="btn primary" onClick={() => finish()} disabled={busy}>
                <Check aria-hidden /> {busy ? 'Setting up…' : 'Finish'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export function ChildForm({ onSave, title, initial }: { onSave: (c: ChildProfile) => void; title: string; initial?: ChildProfile }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [grade, setGrade] = useState(initial?.grade ?? 3); // D-03
  const [avatarId, setAvatar] = useState(initial?.avatarId ?? AVATARS[0].id);
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({
          id: initial?.id ?? uid(),
          name: name.trim(),
          grade,
          avatarId,
          settings: initial?.settings ?? { ...DEFAULT_CHILD_SETTINGS },
          createdAt: initial?.createdAt ?? Date.now(),
        });
      }}
    >
      <h1>{title}</h1>
      <div className="field">
        <label htmlFor="cname">First name or nickname</label>
        <input id="cname" type="text" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" maxLength={24} required />
      </div>
      <div className="field">
        <label htmlFor="cgrade">Grade</label>
        <select id="cgrade" value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g, i) => (
            <option key={g} value={i}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="field" style={{ border: 'none', padding: 0 }}>
        <legend className="label" style={{ marginBottom: 6 }}>
          Pick a buddy picture
        </legend>
        <div className="row" role="radiogroup">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a.id}
              role="radio"
              aria-checked={avatarId === a.id}
              aria-label={a.name}
              className="btn ghost"
              style={{ padding: 4, borderColor: avatarId === a.id ? 'var(--focus)' : 'var(--border)', borderWidth: 3 }}
              onClick={() => setAvatar(a.id)}
            >
              <Avatar id={a.id} size={52} />
            </button>
          ))}
        </div>
      </fieldset>
      <button className="btn primary" disabled={!name.trim()}>
        Save
      </button>
    </form>
  );
}

function PlanEditor({ child, plan, onChange }: { child: ChildProfile; plan: Plan; onChange: (p: Plan) => void }) {
  const toggleSubject = (s: SubjectId) => {
    const subjects = plan.subjects.includes(s) ? plan.subjects.filter((x) => x !== s) : [...plan.subjects, s];
    const decks = plan.decks.filter((k) => subjects.includes(BUILTINS.find((b) => b.key === k)!.subjectId));
    if (!plan.subjects.includes(s)) decks.push(...suggestedDecks(child.grade, [s]));
    onChange({ subjects, decks });
  };
  const toggleDeck = (k: string) => onChange({ ...plan, decks: plan.decks.includes(k) ? plan.decks.filter((x) => x !== k) : [...plan.decks, k] });
  return (
    <section className="panel">
      <div className="row" style={{ marginBottom: 8 }}>
        <Avatar id={child.avatarId} size={40} />
        <h2 style={{ margin: 0 }}>
          {child.name} · {GRADES[child.grade]}
        </h2>
      </div>
      <div className="row">
        {SUBJECTS.filter((s) => s.id !== 'custom').map((s) => (
          <label key={s.id} className="check">
            <input type="checkbox" checked={plan.subjects.includes(s.id)} onChange={() => toggleSubject(s.id)} /> {s.name}
          </label>
        ))}
      </div>
      <details style={{ marginTop: 8 }}>
        <summary style={{ cursor: 'pointer', minHeight: 44, display: 'flex', alignItems: 'center' }}>
          Starting decks ({plan.decks.length}) — tap to review
        </summary>
        {SUBJECTS.filter((s) => plan.subjects.includes(s.id)).map((s) => (
          <div key={s.id}>
            <h3 style={{ fontSize: '1em', marginTop: 12 }}>{s.name}</h3>
            {BUILTINS.filter((b) => b.subjectId === s.id).map((b) => (
              <label key={b.key} className="check">
                <input type="checkbox" checked={plan.decks.includes(b.key)} onChange={() => toggleDeck(b.key)} /> {b.name}
              </label>
            ))}
          </div>
        ))}
      </details>
    </section>
  );
}
