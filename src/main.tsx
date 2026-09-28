import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/lexend/latin-400.css';
import '@fontsource/lexend/latin-600.css';
import './styles.css';
import { AppProvider, useApp } from './app';
import Onboarding from './screens/Onboarding';
import Profiles from './screens/Profiles';
import Home from './screens/Home';
import DeckList from './screens/DeckList';
import Practice from './screens/Practice';
import Summary from './screens/Summary';
import { Owl } from './ui/art';

// Less-used screens load on demand to keep the first load small (07 Performance).
const Sprint = lazy(() => import('./screens/Sprint'));
const StickerBook = lazy(() => import('./screens/StickerBook'));
const ParentArea = lazy(() => import('./screens/parent/ParentArea'));

function Loading() {
  return (
    <div className="center" style={{ paddingTop: '30vh' }} aria-busy="true">
      <Owl size={96} mood="think" label="Loading" />
    </div>
  );
}

function Router() {
  const { route } = useApp();
  switch (route.name) {
    case 'loading':
      return <Loading />;
    case 'onboarding':
      return <Onboarding />;
    case 'profiles':
      return <Profiles />;
    case 'home':
      return <Home />;
    case 'decks':
      return <DeckList subject={route.subject} />;
    case 'practice':
      return <Practice key={JSON.stringify(route)} {...route} />;
    case 'sprint':
      return <Sprint deckId={route.deckId} />;
    case 'summary':
      return <Summary sessionId={route.sessionId} />;
    case 'stickers':
      return <StickerBook />;
    case 'parent':
      return <ParentArea then={route.then} />;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <Suspense fallback={<Loading />}>
        <Router />
      </Suspense>
    </AppProvider>
  </StrictMode>,
);
