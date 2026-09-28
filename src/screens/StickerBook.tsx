// S-07 Sticker book: collected stickers, locked ones as silhouettes.
import { ChevronLeft } from 'lucide-react';
import { ChildScreen, useApp } from '../app';
import { STICKERS } from '../engine/rewards';
import { useChildData } from './hooks';

export default function StickerBook() {
  const { childId, go } = useApp();
  const data = useChildData(childId);
  const have = new Set(data?.rewards.stickersUnlocked ?? []);
  return (
    <ChildScreen>
      <div className="topbar">
        <button className="btn ghost" onClick={() => go({ name: 'home' })}>
          <ChevronLeft aria-hidden /> Back
        </button>
        <h1 style={{ margin: 0, fontSize: '1.4em' }}>Sticker book</h1>
        <span className="spacer" />
        <span className="chip">
          {have.size} / {STICKERS.length}
        </span>
      </div>
      <main className="child-main">
        <div className="stickers">
          {STICKERS.map((s) => {
            const got = have.has(s.id);
            return (
              <div key={s.id} className={`card-surface sticker ${got ? '' : 'locked'}`}>
                {!got && <span className="sr-only">Locked sticker. </span>}
                <div className="art" aria-hidden>
                  {s.emoji}
                </div>
                <b>{got ? s.name : '???'}</b>
                <div className="muted">{s.how}</div>
              </div>
            );
          })}
        </div>
      </main>
    </ChildScreen>
  );
}
