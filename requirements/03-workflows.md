# 03 — Workflows

Each workflow lists the trigger, steps, and edge cases. Child-facing flows assume the child may not read fluently: every key button has an icon, and prompts can be read aloud.

---

## WF-01 First launch (parent setup)
1. Welcome screen: "This app is set up by a grown-up." → **Get started**.
2. Parent creates a 4-digit **parent PIN** (entered twice).
3. Add child profile: name, grade (K–5), avatar (pick from set — no photos of the child).
4. Pick starting subjects (checkboxes, pre-checked by grade).
5. App suggests decks for that grade (e.g. Grade 2 → addition/subtraction to 20, Dolch Grade 2, continents). Parent accepts or edits.
6. Land on the child's Home screen.

Edge: parent skips steps → sensible grade-based defaults applied; can change later.

## WF-02 Child starts a session (the everyday path)
1. Open app → profile picker (skipped if only one child).
2. Child taps their avatar → **Home**.
3. Home shows a big **"Today's Practice"** button (auto-built mix, see `05`) and subject tiles below.
4. Child taps **Today's Practice** → session begins. (≤ 2 taps total, per PO-01.)

Alternate: child taps a subject tile → deck list → taps a deck → mode picker (if the deck allows more than one mode; otherwise start immediately).

## WF-03 Practicing a card
1. Card appears with prompt; audio auto-plays if enabled for the deck.
2. Child answers using the mode's input (flip, type, number pad, multiple choice).
3. Feedback within 300 ms:
   - **Correct:** green check, short cheerful sound, small star animation, auto-advance after ~1 s.
   - **Incorrect:** gentle amber (not red "X"), "Let's look at it together," show the correct answer (letter diff for spelling), and a **Got it** button. No auto-advance — the child must look at the answer.
4. Missed cards are requeued later in the same session (after 3–5 other cards).
5. Card is marked correct in-session only after the child gets it right once after a miss.

Buttons available during a card: 🔊 replay audio, 💡 hint (if exists; using it is recorded), ⏸ pause/quit.

## WF-04 Ending a session
Triggered when: target card count reached, time limit reached, or child taps quit (confirm: "Stop for today?").
1. Celebration screen: stars earned, cards practiced, "You learned 3 new words!"
2. Sticker reward if earned (see `05`).
3. Buttons: **Practice more** / **All done**.
4. "All done" returns to Home. Progress is saved after every card, not only at the end.

## WF-05 Parent adds a spelling list (weekly)
1. From Home, tap the small gear/"Grown-ups" button → enter PIN.
2. **Decks → + New deck → Spelling**.
3. Name the deck (default: "Spelling — Week of Sep 28").
4. Paste or type words. App splits on newlines/commas, trims, removes duplicates, shows a preview list.
5. Optional per word: example sentence, record voice, alternates.
6. Optional: set a **test date** → app prioritizes this deck in Today's Practice until then, then moves it to review.
7. Save → deck assigned to selected child(ren).

Target: 15 words in under 2 minutes (PO-02).

## WF-06 Parent creates a math fact deck
1. Grown-ups → **+ New deck → Math facts**.
2. Pick operation(s), number range/tables, answer mode (number pad / multiple choice), display format.
3. Preview shows count ("48 cards") and 3 samples.
4. Toggle timed sprint on/off. Save.

## WF-06b Parent creates a fractions deck
1. Grown-ups → **+ New deck → Fractions**.
2. Pick skill: Compare / Reduce / Improper ↔ mixed.
3. Pick options (Compare: same denominator / same numerator / unlike; Improper: direction(s)).
4. Preview shows count and 3 samples, rendered as stacked fractions. Save.

## WF-07 Parent creates a custom deck
1. Grown-ups → **+ New deck → Custom**.
2. Add cards one at a time (prompt, answer, optional hint/image) or **Import** CSV/pasted text.
3. Choose modes allowed (flip, type, multiple choice).
4. Save.

## WF-08 Parent edits or archives decks
- Edit any card; changes keep existing progress for unchanged cards.
- **Archive** hides a deck from the child but keeps history. **Delete** requires confirmation and removes history.
- Reorder/pin decks shown on the child's Home.

## WF-09 Parent reviews progress
1. Grown-ups → **Progress** → select child.
2. See: practice days this week, minutes practiced, streak, per-deck mastery %, **trouble cards** list (most-missed), test-date countdowns.
3. Tap a deck → card-by-card accuracy and last-seen date.
4. Tap a trouble card → "Add to focus" (forces into next sessions).

## WF-10 Settings (parent)
Per child: session length (cards or minutes), daily goal, audio auto-play, sound effects on/off, timer mode allowed, hint availability, typo tolerance, font size, dyslexia-friendly font.
Global: change PIN, manage profiles, backup/export data, reset.

## WF-11 Switching child profiles
From Home, tap avatar → profile picker. No PIN required to switch between children (optional setting to require it).

## WF-12 Backup and restore
Parent exports all data to a single file (JSON) and can import it on another device. (Stopgap until/unless cloud sync is added.)

---

## Global edge cases
- **App closed mid-session:** on reopen, offer "Keep going?" to resume.
- **Empty deck:** child never sees it; parent sees a warning.
- **All cards mastered:** show a "You've mastered this deck!" badge; deck moves to occasional review.
- **TTS unavailable:** show text, hide auto-play, notify parent in settings.
- **Child taps rapidly/randomly:** debounce inputs; multiple choice locks after first tap.
