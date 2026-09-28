// Placeholder — implemented in task 11 (see PROGRESS.md).
import type { DeckType } from '../../engine/types';
export default function DeckEditor({ onClose }: { deckId?: string; type?: DeckType; onClose: () => void }) {
  return (
    <div className="panel">
      Deck editor — coming in the next build step. <button className="btn" onClick={onClose}>Back</button>
    </div>
  );
}
