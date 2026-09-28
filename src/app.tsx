// App shell: simple in-memory router + shared state. Everything is local (PR-01).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedBuiltins } from './db/db';
import type { ChildProfile, Mode, ParentSettings, SubjectId } from './engine/types';
import { DEFAULT_CHILD_SETTINGS } from './engine/types';
import { CONTENT_VERSION } from './content/catalog';
import { setSfxEnabled } from './lib/sfx';
import { setVoice, ttsAvailable } from './lib/speech';

export type Route =
  | { name: 'loading' }
  | { name: 'onboarding' }
  | { name: 'profiles' }
  | { name: 'home' }
  | { name: 'decks'; subject: SubjectId }
  | { name: 'practice'; kind: 'today' | 'deck'; deckId?: string; mode?: Mode; resumeId?: string }
  | { name: 'sprint'; deckId: string }
  | { name: 'summary'; sessionId: string }
  | { name: 'stickers' }
  | { name: 'parent'; then?: Route };

interface AppState {
  route: Route;
  go: (r: Route) => void;
  childId: string | null;
  setChildId: (id: string | null) => void;
  child: ChildProfile | undefined;
  parent: ParentSettings | undefined;
}

const Ctx = createContext<AppState | null>(null);
export const useApp = () => {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp outside provider');
  return v;
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ name: 'loading' });
  const [childId, setChildIdState] = useState<string | null>(null);
  const parent = useLiveQuery(() => db.settings.get('parent'), [], undefined);
  const child = useLiveQuery(() => (childId ? db.children.get(childId) : undefined), [childId]);

  const setChildId = useCallback((id: string | null) => {
    setChildIdState(id);
    try {
      if (id) sessionStorage.setItem('hoot-child', id);
    } catch {
      /* private mode */
    }
  }, []);

  const go = useCallback((r: Route) => {
    setRoute(r);
    window.scrollTo?.(0, 0);
  }, []);

  // Boot: decide first screen; refresh built-in content when the app updates.
  useEffect(() => {
    (async () => {
      const p = await db.settings.get('parent');
      if (!p?.onboarded) return go({ name: 'onboarding' });
      if (p.contentVersion !== CONTENT_VERSION) {
        await seedBuiltins();
        await db.settings.update('parent', { contentVersion: CONTENT_VERSION });
      }
      if (!ttsAvailable() && !p.ttsUnavailable) await db.settings.update('parent', { ttsUnavailable: true });
      const kids = await db.children.toArray();
      let last: string | null = null;
      try {
        last = sessionStorage.getItem('hoot-child');
      } catch {
        /* ignore */
      }
      if (kids.length === 1) {
        setChildId(kids[0].id);
        return go({ name: 'home' });
      }
      if (last && kids.some((k) => k.id === last)) {
        setChildId(last);
        return go({ name: 'home' });
      }
      go({ name: 'profiles' });
    })();
  }, [go, setChildId]);

  // Theme (04 Dark mode) and voice.
  useEffect(() => {
    const t = parent?.theme ?? 'system';
    if (t === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = t;
    setVoice(parent?.voiceURI);
  }, [parent?.theme, parent?.voiceURI]);

  useEffect(() => {
    setSfxEnabled(child?.settings.soundEffects ?? true);
  }, [child?.settings.soundEffects]);

  const value = useMemo(() => ({ route, go, childId, setChildId, child, parent }), [route, go, childId, setChildId, child, parent]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** Wraps child-facing screens with that child's display settings (AX-05, AX-06). */
export function ChildScreen({ children }: { children: ReactNode }) {
  const { child } = useApp();
  const s = child?.settings ?? DEFAULT_CHILD_SETTINGS;
  useEffect(() => {
    // The dyslexia-friendly font only downloads when a child has it switched on.
    if (s.dyslexiaFont) import('@fontsource/opendyslexic/400.css');
  }, [s.dyslexiaFont]);
  return (
    <div
      className={`child ${s.dyslexiaFont ? 'dyslexia' : ''}`}
      style={{ ['--scale' as string]: s.fontScale, ['--letter' as string]: s.extraSpacing ? 0.06 : 0 }}
    >
      {children}
    </div>
  );
}

export function childSettings(c?: ChildProfile) {
  return { ...DEFAULT_CHILD_SETTINGS, ...(c?.settings ?? {}) };
}
