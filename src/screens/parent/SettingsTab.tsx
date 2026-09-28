// Global settings (WF-10, WF-12, PR-04, PR-06).
import { useCallback, useEffect, useState } from 'react';
import { Download, Upload, Volume2 } from 'lucide-react';
import { useApp } from '../../app';
import { db, startOfDay } from '../../db/db';
import { deleteAll, downloadText, exportAll, importAll } from '../../lib/backup';
import { hashPin, newSalt } from '../../lib/pin';
import { listVoices, setVoice, speak, ttsAvailable } from '../../lib/speech';
import { Confirm, Modal, PinPad } from '../../ui/common';

export default function SettingsTab() {
  const { parent } = useApp();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(listVoices());
  const [pinStep, setPinStep] = useState<0 | 1 | 2>(0);
  const [newPin, setNewPin] = useState('');
  const [pinMsg, setPinMsg] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [msg, setMsg] = useState('');
  const [wiping, setWiping] = useState(false);

  useEffect(() => {
    if (!ttsAvailable()) return;
    const h = () => setVoices(listVoices());
    speechSynthesis.addEventListener?.('voiceschanged', h);
    return () => speechSynthesis.removeEventListener?.('voiceschanged', h);
  }, []);

  const onPin = useCallback(
    async (p: string) => {
      if (pinStep === 1) {
        setNewPin(p);
        setPinStep(2);
        return;
      }
      if (p !== newPin) {
        setPinMsg("Those didn't match. Try again.");
        setPinStep(1);
        return;
      }
      const salt = newSalt();
      await db.settings.update('parent', { pinSalt: salt, pinHash: await hashPin(p, salt) });
      setPinStep(0);
      setPinMsg('');
      setMsg('PIN changed.');
    },
    [pinStep, newPin],
  );

  if (!parent) return null;
  const up = (patch: Parameters<typeof db.settings.update>[1]) => db.settings.update('parent', patch);
  const today = new Date(startOfDay()).toISOString().slice(0, 10);

  return (
    <>
      {msg && (
        <div className="panel" role="status">
          {msg}
        </div>
      )}
      <section className="panel">
        <h2>Look</h2>
        <fieldset className="field" style={{ border: 'none', padding: 0 }}>
          <legend className="label">Theme</legend>
          <div className="row">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <label key={t} className="check">
                <input type="radio" name="theme" checked={parent.theme === t} onChange={() => up({ theme: t })} /> {t === 'system' ? 'Match device' : t === 'light' ? 'Light' : 'Dark'}
              </label>
            ))}
          </div>
        </fieldset>
      </section>

      <section className="panel">
        <h2>Reading voice</h2>
        {!ttsAvailable() ? (
          <div className="warn" role="alert">
            This device or browser can't read words aloud. Spelling cards will show the sentence and first letter instead. Recording your own voice for spelling words fixes this.
          </div>
        ) : (
          <div className="row">
            <div className="field" style={{ margin: 0, minWidth: 260 }}>
              <label htmlFor="voice">Voice</label>
              <select
                id="voice"
                value={parent.voiceURI ?? ''}
                onChange={(e) => {
                  setVoice(e.target.value || undefined);
                  up({ voiceURI: e.target.value || undefined });
                }}
              >
                <option value="">Device default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" onClick={() => speak('Spell the word: because. I stayed inside because it rained. Because.')}>
              <Volume2 aria-hidden /> Test voice
            </button>
          </div>
        )}
      </section>

      <section className="panel">
        <h2>Security</h2>
        <label className="check">
          <input type="checkbox" checked={parent.requirePinToSwitch} onChange={(e) => up({ requirePinToSwitch: e.target.checked })} /> Require the PIN to switch between children
        </label>
        <button className="btn" onClick={() => setPinStep(1)}>
          Change PIN
        </button>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p className="muted">Everything is saved only on this device. Export a backup file to keep it safe or to move to another device (WF-12).</p>
        <div className="row">
          <button
            className="btn"
            onClick={async () => {
              downloadText(`hoot-flashcards-backup-${today}.json`, await exportAll());
              setMsg('Backup downloaded.');
            }}
          >
            <Download aria-hidden /> Export backup
          </button>
          <label className="btn">
            <Upload aria-hidden /> Restore from backup
            <input type="file" accept="application/json,.json" className="sr-only" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} />
          </label>
        </div>
      </section>

      <section className="panel">
        <h2>Privacy</h2>
        <p>
          Hoot Flash Cards keeps everything on this device. There are no accounts, ads, purchases, or tracking, and nothing is sent to the internet. The only things stored are
          each child's first name or nickname, grade, buddy picture, and practice history, plus any decks, photos, or voice recordings you add. The microphone is used only
          when you tap Record in the grown-ups area.
        </p>
        <button className="btn" style={{ borderColor: 'var(--amber-line)' }} onClick={() => setWiping(true)}>
          Delete all data on this device
        </button>
      </section>

      <section className="panel">
        <h2>Credits</h2>
        <p className="muted" style={{ fontSize: '0.9em' }}>
          Maps: U.S. Census Bureau (via us-atlas) and Natural Earth (via world-atlas), public domain. Fonts: Andika and Lexend (SIL Open Font License), OpenDyslexic
          (SIL OFL). Icons: Lucide (ISC). Word lists, sentences, illustrations and sounds are original to this app.
        </p>
      </section>

      {pinStep > 0 && (
        <Modal title="Change PIN" onClose={() => setPinStep(0)}>
          <PinPad key={pinStep} label={pinStep === 1 ? 'Choose a new 4-digit PIN' : 'Enter it again'} onComplete={onPin} error={pinMsg} />
        </Modal>
      )}
      {importFile && (
        <Confirm
          title="Restore this backup?"
          body="This replaces everything on this device (children, decks, and progress) with the backup."
          yes="Restore"
          onNo={() => setImportFile(null)}
          onYes={async () => {
            try {
              await importAll(await importFile.text());
              location.reload();
            } catch (e) {
              setMsg((e as Error).message);
            }
            setImportFile(null);
          }}
        />
      )}
      {wiping && (
        <Confirm
          title="Delete everything?"
          body="This permanently deletes all children, decks, recordings and progress on this device. Export a backup first if you might want it later."
          yes="Delete everything"
          onNo={() => setWiping(false)}
          onYes={async () => {
            await deleteAll();
            try {
              sessionStorage.clear();
            } catch {
              /* ignore */
            }
            location.reload();
          }}
        />
      )}
    </>
  );
}
