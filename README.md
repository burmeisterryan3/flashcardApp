# Hoot Flash Cards

A flash card app for elementary learners: read-aloud spelling, math facts, fractions, U.S. geography,
sight words and your own custom decks. It's built from the specification in [`requirements/`](requirements/).

- **Works offline** once it's loaded (installable to the home screen on iPad, Android or a computer).
- **Private:** everything stays on the device. There are no accounts, ads or tracking.
- **Spaced review:** cards your child misses come back sooner, and cards they know well come back less often.

## Put it on GitHub Pages (free)

1. Create a new repository on GitHub (it can be private if your plan allows Pages for private repos, or public).
2. Upload this folder's contents, or push it with git:
   ```bash
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. On GitHub, open **Settings → Pages** and set **Source** to **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) runs the tests, builds the app and publishes it.
   After a few minutes the app is live at `https://<you>.github.io/<repo>/`.
5. On the child's tablet, open that link, then choose **Add to Home Screen** (Safari's Share menu or Chrome's ⋮ menu).

Every push to `main` redeploys. The installed app picks up the update the next time it's opened.

## Run it on your computer

Requires [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit + component tests
npm run test:e2e   # end-to-end + accessibility tests (needs: npx playwright install chromium)
npm run build      # production build in dist/
```

## Moving data between devices

There's no sync (decision D-05). In **Grown-ups → Settings → Backup**, export a backup file on one device and restore it on another.

## Project layout

| Path | What's there |
|---|---|
| `requirements/` | The specification (start with `00-README.md`) |
| `src/engine/` | Pure learning logic: spaced review, session builder, answer checking, math and fraction generators, rewards |
| `src/content/` | Built-in decks: original word lists, U.S. states and capitals, continents, oceans |
| `src/db/` | On-device storage (IndexedDB via Dexie) |
| `src/screens/` | Child screens; `src/screens/parent/` is the PIN-protected grown-ups area |
| `src/ui/` | Shared components: inputs, number and fraction pads, maps, visual aids, mascot |
| `e2e/` | End-to-end and accessibility tests (Playwright + axe) |
| `PROGRESS.md` | Build log and resume guide |
