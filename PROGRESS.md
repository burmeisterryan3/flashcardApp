# Build Progress & Resume Guide

This file is the checkpoint log. If a build session is interrupted, start a new session,
attach the latest checkpoint zip (`hoot-flashcards-checkpoint-N.zip`), and say:
**"Resume the flash card build from PROGRESS.md."**

## How to resume (for the builder)
1. Unzip, `cd hoot-flashcards`, run `npm install`.
2. `git log --oneline` — each task ends in a commit named `Task N: …`.
3. Read the task table below; continue at the first task not marked ✅.
4. Run `npm test` and `npm run build` to confirm the checkpoint is healthy before continuing.
5. Requirements live in `requirements/`; `08-open-decisions.md` holds the resolved decisions.

## Task list
| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Update requirements (fractions, spelling, decisions) | ✅ | `requirements/` |
| 2 | Learning engine (pure modules) | ✅ | `src/engine/` |
| 3 | Built-in content | ✅ | `src/content/` |
| 4 | Storage layer (Dexie, seed, backup) | ✅ | `src/db/`, `src/lib/backup.ts` |
| 5 | Design system & shared UI | ✅ | `src/styles.css`, `src/ui/` |
| 6 | Onboarding & profiles | ✅ | `src/screens/` |
| 7 | Child home, deck list, sticker book | ✅ | |
| 8 | Practice screen (all modes) | ✅ | |
| 9 | Fact Sprint & session summary | ✅ | |
| 10 | Parent: gate, progress, decks | ✅ | `src/screens/parent/` |
| 11 | Parent: deck editors | ✅ | |
| 12 | Parent: children & settings | ✅ | |
| 13 | Offline PWA & GitHub Pages deploy | ⏳ | `.github/workflows/deploy.yml` |
| 14 | Automated tests | ⏳ | `src/**/*.test.ts(x)`, `e2e/` |
| 15 | Verify & deliver | ⏳ | |

## Checkpoint zips sent
| Checkpoint | After task | Contents |
|---|---|---|
| 1 | Task 2 | Requirements, engine + 39 passing unit tests |
| 2 | Task 4 | + original content, catalog, storage, backup, PIN; 51 tests pass |
| 3 | Task 9 | + all child-facing screens (setup, home, practice in every mode, sprint, summary, stickers); browser smoke-tested |

## Decisions made during the build
- Stack: React 18 + TypeScript + Vite, Dexie (IndexedDB), vite-plugin-pwa, lucide-react icons, d3-geo maps.
- Card IDs are `${deckId}|<stable key>` so regenerating a deck keeps progress.
- Leitner due dates are day-based (due any time on the due day).
- Fact Sprint answers are logged but don't move Leitner boxes.
- Sight words & sample spelling lists are original (CR-01 updated) — published lists are not copied, to avoid content-filter interruptions.
