// Deck editors: spelling & sight lists (WF-05, CS-01/06), math (WF-06), fractions (WF-06b), custom (WF-07, CC-01..03).
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ImagePlus, Mic, Play, Plus, Square, Trash2, Upload, X } from 'lucide-react';
import { db, putMedia, saveDeck, uid } from '../../db/db';
import { MODE_LABEL, MODES_FOR } from '../../content/catalog';
import { describeCard, generateFractionCards, generateMathCards } from '../../engine/generators';
import { parseCardImport, parseSpellingList } from '../../engine/lists';
import type { Card, Deck, DeckType, FractionConfig, MathConfig, MathOp, Mode, SubjectId } from '../../engine/types';
import { playMedia } from '../../lib/speech';
import { recordingSupported, startRecording, type ActiveRecording } from '../../lib/recorder';
import { MediaImage } from '../practice/MediaImage';
import { useChildren } from './shared';

const SUBJECT_FOR: Record<DeckType, SubjectId> = { spelling: 'spelling', sight: 'reading', math: 'math', fraction: 'fractions', geography: 'geography', custom: 'custom' };

function weekOf(d = new Date()) {
  const m = new Date(d);
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Row {
  id: string;
  prompt: string;
  answer: string;
  sentence: string;
  alternates: string;
  hint: string;
  audioRef?: string;
  imageRef?: string;
}

const emptyRow = (): Row => ({ id: uid().slice(0, 12), prompt: '', answer: '', sentence: '', alternates: '', hint: '' });

export default function DeckEditor({ deckId, type: newType, onClose }: { deckId?: string; type?: DeckType; onClose: () => void }) {
  const kids = useChildren();
  const [loaded, setLoaded] = useState(!deckId);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [type, setType] = useState<DeckType>(newType ?? 'custom');
  const [name, setName] = useState('');
  const [assigned, setAssigned] = useState<string[]>([]);
  const [testDate, setTestDate] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [paste, setPaste] = useState('');
  const [modes, setModes] = useState<Mode[]>([]);
  const [defaultMode, setDefaultMode] = useState<Mode>('flip');
  const [sprint, setSprint] = useState(true);
  const [math, setMath] = useState<MathConfig>({ ops: ['mul'], maxSum: 20, tables: [2, 3, 4, 5], display: 'horizontal' });
  const [frac, setFrac] = useState<FractionConfig>({ skill: 'compare', compareLevels: ['same-d', 'same-n'], directions: ['to-mixed'] });
  const [oldMedia, setOldMedia] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Load existing deck, or defaults for a new one.
  useEffect(() => {
    (async () => {
      if (!deckId) {
        const t = newType ?? 'custom';
        setName(t === 'spelling' ? `Spelling — Week of ${weekOf()}` : t === 'sight' ? `Sight words — ${weekOf()}` : '');
        setModes(t === 'custom' ? ['flip', 'type'] : MODES_FOR[t]);
        setDefaultMode(MODES_FOR[t][0]);
        setAssigned(kids.map((k) => k.id));
        return;
      }
      const d = await db.decks.get(deckId);
      if (!d) return onClose();
      const cards = await db.cards.where('deckId').equals(deckId).toArray();
      setDeck(d);
      setType(d.type);
      setName(d.name);
      setAssigned(d.assignedChildIds);
      setTestDate(d.testDate ?? '');
      setCaseSensitive(!!d.caseSensitive);
      setModes(d.modesAllowed);
      setDefaultMode(d.defaultMode);
      setSprint(d.sprintEnabled !== false);
      if (d.generatorConfig?.kind === 'math') setMath(d.generatorConfig.math);
      if (d.generatorConfig?.kind === 'fraction') setFrac(d.generatorConfig.fraction);
      setRows(
        cards.map((c) => ({
          id: c.id.split('|').pop()!,
          prompt: c.prompt.text ?? '',
          answer: c.answer,
          sentence: c.exampleSentence ?? '',
          alternates: c.alternates.join(', '),
          hint: c.hint ?? '',
          audioRef: c.prompt.audioRef,
          imageRef: c.prompt.imageRef,
        })),
      );
      setOldMedia(cards.flatMap((c) => [c.prompt.audioRef, c.prompt.imageRef]).filter((x): x is string => !!x));
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  // Assign new decks to every child by default once children load.
  useEffect(() => {
    if (!deckId && assigned.length === 0 && kids.length) setAssigned(kids.map((k) => k.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kids.length]);

  const id = useMemo(() => deckId ?? `deck:${uid()}`, [deckId]);
  const isList = type === 'spelling' || type === 'sight';

  const cards: Card[] = useMemo(() => {
    if (type === 'math') return generateMathCards(id, math);
    if (type === 'fraction') return generateFractionCards(id, frac);
    return rows
      .filter((r) => (isList ? r.answer.trim() : (r.prompt.trim() || r.imageRef) && r.answer.trim()))
      .map((r): Card => {
        const alternates = r.alternates.split(',').map((s) => s.trim()).filter(Boolean);
        if (type === 'spelling')
          return { id: `${id}|spell:${r.answer.trim().toLowerCase()}`, deckId: id, kind: 'spell', prompt: { audioRef: r.audioRef }, answer: r.answer.trim(), alternates, exampleSentence: r.sentence.trim() || undefined, tags: [] };
        if (type === 'sight')
          return { id: `${id}|sight:${r.answer.trim().toLowerCase()}`, deckId: id, kind: 'sight', prompt: { text: r.answer.trim(), audioRef: r.audioRef }, answer: r.answer.trim(), alternates: [], tags: [] };
        return { id: `${id}|${r.id}`, deckId: id, kind: 'text', prompt: { text: r.prompt.trim() || undefined, imageRef: r.imageRef }, answer: r.answer.trim(), alternates, hint: r.hint.trim() || undefined, tags: [] };
      });
  }, [type, id, math, frac, rows, isList]);

  const addPasted = () => {
    if (isList) {
      const have = new Set(rows.map((r) => r.answer.toLowerCase()));
      const add = parseSpellingList(paste).filter((w) => !have.has(w.word.toLowerCase()));
      setRows((rs) => [...rs, ...add.map((w) => ({ ...emptyRow(), answer: w.word, sentence: w.sentence ?? '' }))]);
    } else {
      const add = parseCardImport(paste);
      if (!add.length) return setError('No cards found. Use one card per line: prompt, answer, hint (hint optional).');
      setRows((rs) => [...rs, ...add.map((p) => ({ ...emptyRow(), prompt: p.prompt, answer: p.answer, hint: p.hint ?? '' }))]);
    }
    setPaste('');
    setError('');
  };

  const setRow = (rid: string, patch: Partial<Row>) => setRows((rs) => rs.map((r) => (r.id === rid ? { ...r, ...patch } : r)));

  const save = async () => {
    if (!name.trim()) return setError('Give the deck a name.');
    if (!cards.length) return setError('Add at least one card.');
    if (type === 'math' && (!math.ops.length || ((math.ops.includes('mul') || math.ops.includes('div')) && !math.tables.length))) return setError('Pick at least one operation and table.');
    if (type === 'custom' && !modes.length) return setError('Pick at least one practice style.');
    setSaving(true);
    const now = Date.now();
    const allowed = type === 'custom' ? modes : type === 'fraction' ? (frac.skill === 'compare' ? ['compare', 'sprint'] : ['fraction']) as Mode[] : MODES_FOR[type];
    const d: Deck = {
      id,
      subjectId: SUBJECT_FOR[type],
      name: name.trim(),
      type,
      modesAllowed: allowed,
      defaultMode: allowed.includes(defaultMode) ? defaultMode : allowed[0],
      testDate: testDate || undefined,
      generatorConfig: type === 'math' ? { kind: 'math', math } : type === 'fraction' ? { kind: 'fraction', fraction: frac } : undefined,
      isBuiltIn: false,
      archived: deck?.archived ?? false,
      assignedChildIds: assigned,
      caseSensitive,
      sprintEnabled: allowed.includes('sprint') ? sprint : undefined,
      pinned: deck?.pinned,
      order: deck?.order ?? now,
      createdAt: deck?.createdAt ?? now,
      updatedAt: now,
    };
    await saveDeck(d, cards);
    const keep = new Set(cards.flatMap((c) => [c.prompt.audioRef, c.prompt.imageRef]));
    await db.media.bulkDelete(oldMedia.filter((m) => !keep.has(m)));
    onClose();
  };

  if (!loaded) return null;
  const title = { spelling: 'Spelling list', sight: 'Sight words', math: 'Math facts', fraction: 'Fractions', custom: 'Custom deck', geography: 'Geography' }[type];

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="btn ghost" onClick={onClose}>
          <ChevronLeft aria-hidden /> Decks
        </button>
        <h2 style={{ margin: 0 }}>
          {deckId ? 'Edit' : 'New'} {title.toLowerCase()}
        </h2>
      </div>

      <section className="panel">
        <div className="field">
          <label htmlFor="dname">Deck name</label>
          <input id="dname" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={type === 'math' ? 'e.g. ×7 facts' : 'e.g. Science words'} />
        </div>
        <div className="row" style={{ alignItems: 'flex-start', gap: 24 }}>
          <fieldset className="field" style={{ border: 'none', padding: 0, margin: 0 }}>
            <legend className="label">Show to</legend>
            {kids.map((k) => (
              <label key={k.id} className="check">
                <input type="checkbox" checked={assigned.includes(k.id)} onChange={(e) => setAssigned((a) => (e.target.checked ? [...a, k.id] : a.filter((x) => x !== k.id)))} />
                {k.name}
              </label>
            ))}
          </fieldset>
          <div className="field" style={{ margin: 0 }}>
            <label htmlFor="tdate">Test date (optional)</label>
            <input id="tdate" type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} />
            <span className="muted" style={{ fontSize: '0.85em' }}>
              The deck gets extra practice in the days before.
            </span>
          </div>
        </div>
      </section>

      {isList && (
        <ListEditor
          type={type}
          rows={rows}
          paste={paste}
          setPaste={setPaste}
          addPasted={addPasted}
          setRow={setRow}
          remove={(rid) => setRows((rs) => rs.filter((r) => r.id !== rid))}
        />
      )}
      {type === 'math' && <MathEditor cfg={math} setCfg={setMath} sprint={sprint} setSprint={setSprint} defaultMode={defaultMode} setDefaultMode={setDefaultMode} />}
      {type === 'fraction' && <FractionEditor cfg={frac} setCfg={setFrac} sprint={sprint} setSprint={setSprint} />}
      {type === 'custom' && (
        <CustomEditor
          rows={rows}
          setRows={setRows}
          setRow={setRow}
          paste={paste}
          setPaste={setPaste}
          addPasted={addPasted}
          modes={modes}
          setModes={setModes}
          defaultMode={defaultMode}
          setDefaultMode={setDefaultMode}
          caseSensitive={caseSensitive}
          setCaseSensitive={setCaseSensitive}
        />
      )}

      {(type === 'math' || type === 'fraction') && (
        <section className="panel">
          <h3>Preview</h3>
          <p>
            <b>{cards.length} cards</b> — for example:
          </p>
          <ul>
            {cards
              .filter((_, i) => i % Math.max(1, Math.floor(cards.length / 3)) === 0)
              .slice(0, 3)
              .map((c) => (
                <li key={c.id}>{describeCard(c)}</li>
              ))}
          </ul>
        </section>
      )}

      {error && (
        <div className="warn" role="alert" style={{ marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div className="row end">
        <button className="btn ghost" onClick={onClose}>
          Cancel
        </button>
        <button className="btn primary" onClick={save} disabled={saving}>
          Save deck ({cards.length} cards)
        </button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ Spelling & sight lists

function ListEditor({
  type,
  rows,
  paste,
  setPaste,
  addPasted,
  setRow,
  remove,
}: {
  type: DeckType;
  rows: Row[];
  paste: string;
  setPaste: (v: string) => void;
  addPasted: () => void;
  setRow: (id: string, p: Partial<Row>) => void;
  remove: (id: string) => void;
}) {
  const spelling = type === 'spelling';
  return (
    <section className="panel">
      <div className="field">
        <label htmlFor="paste">Paste or type the words</label>
        <textarea
          id="paste"
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder={spelling ? 'One word per line, or separated by commas.\nOptional sentence: because | I stayed in because it rained.' : 'One word per line, or separated by commas.'}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
        />
        <div>
          <button className="btn" onClick={addPasted} disabled={!paste.trim()}>
            <Plus aria-hidden /> Add to list
          </button>
        </div>
      </div>
      {rows.length > 0 && (
        <>
          <h3>
            {rows.length} word{rows.length === 1 ? '' : 's'}
          </h3>
          {spelling && (
            <p className="muted" style={{ fontSize: '0.9em' }}>
              Sentences are read aloud between the word (the word is hidden on screen). Record your own voice if the device says a word oddly.
            </p>
          )}
          <table className="list responsive">
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td style={{ width: '22%' }}>
                    <input className="input" aria-label="Word" value={r.answer} onChange={(e) => setRow(r.id, { answer: e.target.value })} autoCapitalize="none" spellCheck={false} />
                  </td>
                  {spelling && (
                    <td>
                      <input className="input" aria-label={`Example sentence for ${r.answer}`} placeholder="Example sentence (optional)" value={r.sentence} onChange={(e) => setRow(r.id, { sentence: e.target.value })} />
                    </td>
                  )}
                  {spelling && (
                    <td style={{ width: '16%' }}>
                      <input className="input" aria-label={`Also accept for ${r.answer}`} placeholder="Also accept" value={r.alternates} onChange={(e) => setRow(r.id, { alternates: e.target.value })} />
                    </td>
                  )}
                  <td style={{ whiteSpace: 'nowrap' }}>
                    <VoiceRecorder word={r.answer} value={r.audioRef} onChange={(audioRef) => setRow(r.id, { audioRef })} />
                    <button className="btn ghost small" aria-label={`Remove ${r.answer}`} onClick={() => remove(r.id)}>
                      <X size={16} aria-hidden />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

/** CS-06: parent-only recording. The browser asks for microphone permission (CS-04). */
function VoiceRecorder({ word, value, onChange }: { word: string; value?: string; onChange: (ref?: string) => void }) {
  const [rec, setRec] = useState<ActiveRecording | null>(null);
  const [err, setErr] = useState('');
  if (!recordingSupported()) return null;
  if (rec)
    return (
      <button
        className="btn small primary"
        aria-label={`Stop recording ${word}`}
        onClick={async () => {
          const blob = await rec.stop();
          setRec(null);
          onChange(await putMedia(blob, 'audio'));
        }}
      >
        <Square size={14} aria-hidden /> Stop
      </button>
    );
  return (
    <>
      {value && (
        <>
          <button className="btn ghost small" aria-label={`Play your recording of ${word}`} onClick={() => playMedia(value)}>
            <Play size={16} aria-hidden />
          </button>
          <button className="btn ghost small" aria-label={`Delete your recording of ${word}`} onClick={() => onChange(undefined)}>
            <Trash2 size={16} aria-hidden />
          </button>
        </>
      )}
      <button
        className="btn ghost small"
        aria-label={`${value ? 'Re-record' : 'Record'} ${word} in your voice`}
        title="Record your voice (the browser will ask for the microphone)"
        onClick={async () => {
          try {
            setErr('');
            setRec(await startRecording());
          } catch {
            setErr('Microphone not allowed');
          }
        }}
      >
        <Mic size={16} aria-hidden />
      </button>
      {err && <span className="muted"> {err}</span>}
    </>
  );
}

// ------------------------------------------------------------------ Math

function MathEditor({
  cfg,
  setCfg,
  sprint,
  setSprint,
  defaultMode,
  setDefaultMode,
}: {
  cfg: MathConfig;
  setCfg: (c: MathConfig) => void;
  sprint: boolean;
  setSprint: (v: boolean) => void;
  defaultMode: Mode;
  setDefaultMode: (m: Mode) => void;
}) {
  const ops: [MathOp, string][] = [
    ['add', 'Addition'],
    ['sub', 'Subtraction'],
    ['mul', 'Multiplication'],
    ['div', 'Division'],
  ];
  const toggleOp = (op: MathOp) => setCfg({ ...cfg, ops: cfg.ops.includes(op) ? cfg.ops.filter((o) => o !== op) : [...cfg.ops, op] });
  const toggleT = (t: number) => setCfg({ ...cfg, tables: cfg.tables.includes(t) ? cfg.tables.filter((x) => x !== t) : [...cfg.tables, t].sort((a, b) => a - b) });
  const addSub = cfg.ops.includes('add') || cfg.ops.includes('sub');
  const mulDiv = cfg.ops.includes('mul') || cfg.ops.includes('div');
  return (
    <section className="panel">
      <fieldset className="field" style={{ border: 'none', padding: 0 }}>
        <legend className="label">Operations</legend>
        <div className="row">
          {ops.map(([op, label]) => (
            <label key={op} className="check">
              <input type="checkbox" checked={cfg.ops.includes(op)} onChange={() => toggleOp(op)} /> {label}
            </label>
          ))}
        </div>
      </fieldset>
      {addSub && (
        <div className="field">
          <label htmlFor="maxsum">Addition & subtraction range</label>
          <select id="maxsum" value={cfg.maxSum} onChange={(e) => setCfg({ ...cfg, maxSum: Number(e.target.value) as MathConfig['maxSum'] })}>
            <option value={10}>Facts to 10</option>
            <option value={20}>Facts to 20</option>
            <option value={100}>Within 100 (tens and ones)</option>
          </select>
        </div>
      )}
      {mulDiv && (
        <fieldset className="field" style={{ border: 'none', padding: 0 }}>
          <legend className="label">Times tables{cfg.ops.includes('div') ? ' (division uses the same tables; never ÷0)' : ''}</legend>
          <div className="row" style={{ gap: 4 }}>
            {Array.from({ length: 13 }, (_, t) => (
              <label key={t} className="check" style={{ minWidth: 60 }}>
                <input type="checkbox" checked={cfg.tables.includes(t)} onChange={() => toggleT(t)} />×{t}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="row" style={{ gap: 24 }}>
        <div className="field">
          <label htmlFor="amode">Answer with</label>
          <select id="amode" value={defaultMode} onChange={(e) => setDefaultMode(e.target.value as Mode)}>
            <option value="numpad">Number pad</option>
            <option value="choice">Multiple choice</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="disp">Show problems</label>
          <select id="disp" value={cfg.display} onChange={(e) => setCfg({ ...cfg, display: e.target.value as MathConfig['display'] })}>
            <option value="horizontal">Across (7 + 5 = ?)</option>
            <option value="vertical">Stacked (column)</option>
          </select>
        </div>
      </div>
      <label className="check">
        <input type="checkbox" checked={sprint} onChange={(e) => setSprint(e.target.checked)} /> Allow timed Fact Sprint for this deck
      </label>
    </section>
  );
}

// ------------------------------------------------------------------ Fractions

function FractionEditor({ cfg, setCfg, sprint, setSprint }: { cfg: FractionConfig; setCfg: (c: FractionConfig) => void; sprint: boolean; setSprint: (v: boolean) => void }) {
  const toggle = <K extends 'compareLevels' | 'directions'>(key: K, v: NonNullable<FractionConfig[K]>[number]) => {
    const cur = (cfg[key] ?? []) as string[];
    setCfg({ ...cfg, [key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  return (
    <section className="panel">
      <fieldset className="field" style={{ border: 'none', padding: 0 }}>
        <legend className="label">Skill</legend>
        {(
          [
            ['compare', 'Compare fractions (<, =, >)'],
            ['reduce', 'Reduce to simplest form'],
            ['improper', 'Improper fractions ↔ whole and mixed numbers'],
          ] as const
        ).map(([k, label]) => (
          <label key={k} className="check">
            <input type="radio" name="skill" checked={cfg.skill === k} onChange={() => setCfg({ ...cfg, skill: k })} /> {label}
          </label>
        ))}
      </fieldset>
      {cfg.skill === 'compare' && (
        <>
          <fieldset className="field" style={{ border: 'none', padding: 0 }}>
            <legend className="label">Levels</legend>
            <label className="check">
              <input type="checkbox" checked={!!cfg.compareLevels?.includes('same-d')} onChange={() => toggle('compareLevels', 'same-d')} /> Same denominator (2/6 vs 5/6)
            </label>
            <label className="check">
              <input type="checkbox" checked={!!cfg.compareLevels?.includes('same-n')} onChange={() => toggle('compareLevels', 'same-n')} /> Same numerator (3/4 vs 3/8)
            </label>
            <label className="check">
              <input type="checkbox" checked={!!cfg.compareLevels?.includes('unlike')} onChange={() => toggle('compareLevels', 'unlike')} /> Unlike denominators (grade 4 stretch)
            </label>
          </fieldset>
          <label className="check">
            <input type="checkbox" checked={sprint} onChange={(e) => setSprint(e.target.checked)} /> Allow timed Fact Sprint for this deck
          </label>
        </>
      )}
      {cfg.skill === 'reduce' && (
        <label className="check">
          <input type="checkbox" checked={!!cfg.includeSimplest} onChange={(e) => setCfg({ ...cfg, includeSimplest: e.target.checked })} /> Include some already-simplest fractions (harder)
        </label>
      )}
      {cfg.skill === 'improper' && (
        <fieldset className="field" style={{ border: 'none', padding: 0 }}>
          <legend className="label">Directions</legend>
          <label className="check">
            <input type="checkbox" checked={!!cfg.directions?.includes('to-mixed')} onChange={() => toggle('directions', 'to-mixed')} /> Improper → whole or mixed number (11/4 → 2 3/4)
          </label>
          <label className="check">
            <input type="checkbox" checked={!!cfg.directions?.includes('to-improper')} onChange={() => toggle('directions', 'to-improper')} /> Mixed → improper fraction (2 3/4 → 11/4)
          </label>
        </fieldset>
      )}
    </section>
  );
}

// ------------------------------------------------------------------ Custom

function CustomEditor({
  rows,
  setRows,
  setRow,
  paste,
  setPaste,
  addPasted,
  modes,
  setModes,
  defaultMode,
  setDefaultMode,
  caseSensitive,
  setCaseSensitive,
}: {
  rows: Row[];
  setRows: (f: (r: Row[]) => Row[]) => void;
  setRow: (id: string, p: Partial<Row>) => void;
  paste: string;
  setPaste: (v: string) => void;
  addPasted: () => void;
  modes: Mode[];
  setModes: (m: Mode[]) => void;
  defaultMode: Mode;
  setDefaultMode: (m: Mode) => void;
  caseSensitive: boolean;
  setCaseSensitive: (v: boolean) => void;
}) {
  const [importing, setImporting] = useState(false);
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    setPaste(await f.text());
    setImporting(true);
  };
  return (
    <>
      <section className="panel">
        <fieldset className="field" style={{ border: 'none', padding: 0 }}>
          <legend className="label">Practice styles</legend>
          <div className="row">
            {(['flip', 'type', 'choice'] as Mode[]).map((m) => (
              <label key={m} className="check">
                <input type="checkbox" checked={modes.includes(m)} onChange={() => setModes(modes.includes(m) ? modes.filter((x) => x !== m) : [...modes, m])} /> {MODE_LABEL[m]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="row" style={{ gap: 24 }}>
          <div className="field">
            <label htmlFor="dm">Default style</label>
            <select id="dm" value={modes.includes(defaultMode) ? defaultMode : modes[0]} onChange={(e) => setDefaultMode(e.target.value as Mode)}>
              {modes.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABEL[m]}
                </option>
              ))}
            </select>
          </div>
          <label className="check">
            <input type="checkbox" checked={caseSensitive} onChange={(e) => setCaseSensitive(e.target.checked)} /> Capital letters matter
          </label>
        </div>
        {modes.includes('choice') && rows.length < 3 && <p className="muted">Multiple choice needs at least 3 cards with different answers.</p>}
      </section>

      <section className="panel">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3 style={{ margin: 0 }}>{rows.length} cards</h3>
          <div className="row">
            <button className="btn ghost" onClick={() => setImporting((v) => !v)} aria-expanded={importing}>
              <Upload size={16} aria-hidden /> Import
            </button>
            <button className="btn" onClick={() => setRows((r) => [...r, emptyRow()])}>
              <Plus size={16} aria-hidden /> Add card
            </button>
          </div>
        </div>
        {importing && (
          <div className="field" style={{ marginTop: 12 }}>
            <label htmlFor="imp">Paste cards — one per line: prompt, answer, hint (hint optional). Tabs from a spreadsheet work too.</label>
            <textarea id="imp" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={'What gas do plants breathe in?, carbon dioxide\nH2O\twater'} />
            <div className="row">
              <label className="btn ghost small">
                <input type="file" accept=".csv,.txt,text/csv,text/plain" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
                Choose a CSV file
              </label>
              <button className="btn" onClick={addPasted} disabled={!paste.trim()}>
                Add these cards
              </button>
            </div>
          </div>
        )}
        <table className="list responsive" style={{ marginTop: 8 }}>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id}>
                <td>
                  <input className="input" aria-label={`Card ${i + 1} prompt`} placeholder="Prompt (front)" value={r.prompt} onChange={(e) => setRow(r.id, { prompt: e.target.value })} />
                  {r.imageRef && (
                    <div className="row" style={{ marginTop: 6 }}>
                      <MediaImage id={r.imageRef} alt={`Photo for card ${i + 1}`} />
                      <button className="btn ghost small" onClick={() => setRow(r.id, { imageRef: undefined })}>
                        Remove photo
                      </button>
                    </div>
                  )}
                </td>
                <td>
                  <input className="input" aria-label={`Card ${i + 1} answer`} placeholder="Answer (back)" value={r.answer} onChange={(e) => setRow(r.id, { answer: e.target.value })} />
                </td>
                <td>
                  <input className="input" aria-label={`Card ${i + 1} hint`} placeholder="Hint (optional)" value={r.hint} onChange={(e) => setRow(r.id, { hint: e.target.value })} />
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <label className="btn ghost small" aria-label={`Add a photo to card ${i + 1}`} title="Add a photo">
                    <ImagePlus size={16} aria-hidden />
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setRow(r.id, { imageRef: await putMedia(f, 'image') });
                      }}
                    />
                  </label>
                  <button className="btn ghost small" aria-label={`Remove card ${i + 1}`} onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))}>
                    <X size={16} aria-hidden />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
