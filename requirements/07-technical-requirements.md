# 07 — Technical Requirements

## Platform (recommended default — confirm in `08`)
**Progressive Web App (PWA)**, one codebase that runs on iPad, Android tablets, phones, and computers, installable to the home screen, working offline.
- **TR-01** Framework: React + TypeScript, built with Vite.
- **TR-02** Styling: Tailwind CSS or CSS variables with a design-token file (colors, radii, type scale from `04`).
- **TR-03** Offline: service worker caches app shell, bundled decks, images, and sounds. App must function with no network after first load.
- **TR-04** Storage: IndexedDB (via Dexie.js or similar). No localStorage for primary data.
- **TR-05** TTS: Web Speech API (`speechSynthesis`), with voice selection in settings; parent-recorded audio stored as blobs in IndexedDB.
- **TR-06** No backend in v1.
- **TR-07** Upgrade path: if native app-store apps are wanted later, wrap with Capacitor without rewriting.

Supported browsers: latest 2 versions of Safari (iPadOS/iOS), Chrome (Android/desktop), Edge, Firefox.

## Data model (initial)
```
ChildProfile   { id, name, grade, avatarId, settings{...}, createdAt }
Subject        { id, name, color, icon }                    // built-in + custom
Deck           { id, subjectId, name, type: spelling|math|fraction|geography|sight|custom,
                 modesAllowed[], testDate?, generatorConfig?, isBuiltIn,
                 archived, assignedChildIds[], createdAt, updatedAt }
Card           { id, deckId, prompt{text?, imageRef?, audioRef?},
                 answer, alternates[], hint?, exampleSentence?, tags[] }
CardProgress   { childId, cardId, box(1-5), dueAt, timesSeen, timesCorrect,
                 lastSeenAt, mastered, focus }
Attempt        { id, childId, cardId, deckId, sessionId, timestamp, mode,
                 answerGiven, correct, usedHint, responseMs }
Session        { id, childId, startedAt, endedAt, cardsPlanned, cardsDone,
                 starsEarned, completed }
Rewards        { childId, stars, streakDays, lastGoalDate, freezesLeft,
                 stickersUnlocked[] }
ParentSettings { pinHash, theme, reminderEnabled, ... }
```
- Math decks store `generatorConfig` and generate cards deterministically so progress stays attached to stable card IDs (e.g. `math:mul:7x8`).
- PIN stored as a salted hash, never plain text.
- Export format: single versioned JSON file (`schemaVersion` field) including audio as base64.

## Performance
- First load < 3 s on a mid-range tablet over 4G; subsequent loads < 1 s.
- Card transition < 100 ms after input; feedback < 300 ms.
- Bundle size target < 500 KB JS gzipped (excluding content assets).

## Code quality
- TypeScript strict mode.
- Learning engine (Leitner logic, session builder, answer checker, math generator) as pure, UI-free modules.
- Unit tests for: answer checking (AC rules), box transitions, session builder rules, math generator edge cases (no negatives, no ÷0, whole-number division), fraction generators and form checks (simplest form, whole/mixed answers, zero denominators), list parsing for spelling import.
- Component tests for practice screen modes.
- End-to-end test for WF-01, WF-02/03/04, and WF-05.
- Automated accessibility checks (axe) in CI.

## Content assets
- Bundled decks as JSON in `/content`.
- Maps: U.S. states from `us-atlas` and world countries from `world-atlas` (both ISC, derived from public-domain U.S. Census and Natural Earth data), drawn with `d3-geo`. Record sources in `CREDITS.md`.
- Sounds: original or CC0-licensed; record sources.
