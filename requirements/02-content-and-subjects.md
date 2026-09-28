# 02 — Content and Subjects

## Structure
**Subject → Deck → Card.**
- A **subject** is a category with its own color and icon (Spelling, Math, Fractions, Geography, Reading, Custom).
- A **deck** is a set of cards practiced together (e.g. "Week 6 Spelling", "×7 Facts", "Southeast States").
- A **card** has a front (prompt) and back (answer), plus optional extras.

## Card fields
| Field | Required | Notes |
|---|---|---|
| Prompt text | Yes* | *Or image or audio |
| Prompt image | No | Uploaded photo or bundled image (maps, flags) |
| Prompt audio | No | TTS by default; parent can record their own voice |
| Answer | Yes | Canonical answer |
| Accepted alternates | No | e.g. "St. Paul", "Saint Paul" |
| Hint | No | Shown on request |
| Example sentence | No | Mainly spelling ("The **because** word: I stayed in because it rained.") |
| Tags | No | For filtering |

## Subjects

### Spelling — read-aloud spelling (MUST)
Spelling is its own subject. The core activity mirrors a classroom spelling test: **the word is read aloud and the child spells it.** The word itself is never shown before the child answers.

**Creating spelling decks**
- **CS-01** Parent creates a deck by pasting a list (one word per line, or comma-separated). Optional per-line format `word | example sentence`.
- **CS-06** Parent can record their own pronunciation per word (useful when TTS mispronounces). A recording, when present, replaces TTS for the word.

**The read-aloud card (default mode, "Hear & Spell")**
- **CS-02** When the card appears the app speaks: the word → the example sentence (if any) → the word again. Order: "*because*. I stayed inside because it rained. *because*."
- **CS-03** Large **Hear it again** button always visible; **Slow** button replays at ~0.6× speed. A **Sentence** button replays just the sentence.
- **CS-08** The card face shows only a speaker icon and "Spell the word you hear" — never the word, and the example sentence is shown with the word blanked (`I stayed inside ______ it rained.`) so reading along doesn't give it away.
- **CS-09** If speech is unavailable and there's no recording, the card falls back to showing the blanked sentence plus the first letter as a hint, and tells the parent in Settings.
- **CS-10** Hint (optional, recorded as hint use): reveals the number of letters as boxes, then the first letter.

**Answering**
- Typing field with autocorrect, autocapitalize, autocomplete and spellcheck **off**.
- **CS-04** Case-insensitive; ignores leading/trailing spaces. Exact spelling required (AC-04).
- **CS-05** Wrong answers show a letter-by-letter comparison (correct letters green, wrong/missing highlighted with a mark, not just color) and the app says the word and spells it out loud ("b-e-c-a-u-s-e").
- **CS-11** After a miss, the child must type the word correctly once (copy it) before continuing — this is the "write it once correctly" habit teachers use.

**Other spelling modes**
- **CS-07** "Test day" mode — no hints, one attempt per word, no feedback until the end, then a score screen listing each word right or to-practice. Mimics the Friday test. Results update Leitner boxes like normal practice.
- **CS-12** "Look, Cover, Write" warm-up mode (SHOULD): word shown for 3 seconds, hidden, child types it. Useful on the first day with a new list.

### Fractions (MUST)
Grade-3 fraction skills (aligned with IXL-style grade 3–4 skill groupings, see D-14). All fraction decks are **auto-generated** from settings like math facts, with stable card IDs (e.g. `frac:cmp:3/4:2/3`).

Fractions are always displayed as stacked fractions (numerator over a bar over denominator), never as `3/4` text, on child screens. Screen readers read them as "three fourths".

**Skill 1 — Compare fractions (CF)**
- **CF-01** Card shows two fractions; child picks `<`, `=`, or `>` from three large buttons (or taps the bigger fraction).
- **CF-02** Levels (parent picks one or more):
  - *Same denominator* (`2/6` vs `5/6`)
  - *Same numerator* (`3/4` vs `3/8`)
  - *Unlike denominators* using denominators 2, 3, 4, 6, 8, 10, 12 (grade-4 stretch).
  - Include equal pairs (`2/4` vs `1/2`) about 1 in 6 cards.
- **CF-03** Visual aid on request: two fraction bars of equal length, shaded, one above the other.
- **CF-04** Feedback after a miss shows the bars and one sentence of reasoning ("Same bottom number, so the bigger top number is bigger.").

**Skill 2 — Reduce fractions to simplest form (RF)**
- **RF-01** Card shows a fraction (e.g. `6/8`); child enters the simplest form using a fraction input (two number fields stacked, numerator on top), with the on-screen number pad.
- **RF-02** Generated from simplest-form fractions with denominators 2–12 multiplied by 2–6, capped at denominator 60. Every generated card is reducible (never already in simplest form) unless the parent enables "include already-simplest" for a harder version where the child must enter it unchanged.
- **RF-03** Answer must be fully reduced: `3/6` for `6/12` is marked "Almost — can you make it even simpler?" and the child gets one more try without it counting as a miss. Correct value, not fully reduced, on the second try counts as a miss.
- **RF-04** Hint: shows the greatest common factor ("Both numbers can be divided by 3").
- **RF-05** Wholes are allowed as answers: `4/4` → `1`, `6/3` → `2` (whole-number answer accepted in the numerator field with denominator blank or 1).

**Skill 3 — Improper fractions ↔ whole and mixed numbers (IF)**
- **IF-01** *Improper → mixed/whole:* card shows `11/4`; child enters `2 3/4` using a mixed-number input (whole box + stacked fraction boxes). If the result is a whole number (`12/4`), entering `3` with the fraction boxes empty is correct.
- **IF-02** The fractional part must be in simplest form (`10/4` → `2 1/2`; `2 2/4` gets the "Almost — simpler?" retry from RF-03).
- **IF-03** *Mixed/whole → improper* (reverse direction): card shows `2 3/4`; child enters `11/4`. Parent can include either or both directions.
- **IF-04** Generated with denominators 2–10 and whole parts 1–5.
- **IF-05** Visual aid on request: that many whole circles plus a partial circle, split into the denominator's pieces.
- **IF-06** Hint: "How many groups of 4 fit into 11?"

**Fraction input and answer rules**
- **FR-01** Custom on-screen number pad with a "next box" arrow; no system keyboard. Hardware keyboard: digits type into the active box, Tab/`/`/space moves to the next box, Enter checks.
- **FR-02** Answers are compared by value **and** form: correct value + simplest form required where the skill says so (RF, IF). Denominator of 0 is never generated and is rejected as input with a gentle message.
- **FR-03** Fraction decks support Fact Sprint (D-10) for Compare only; Reduce and Improper are untimed.

### Math facts (MUST)
- **CM-01** Operations: addition, subtraction, multiplication, division.
- **CM-02** Auto-generated decks from settings, not typed by hand:
  - Addition: addends 0–10 (or 0–20); option "facts to 10 / 20 / 100".
  - Subtraction: no negative results; minuend up to 10/20/100.
  - Multiplication: pick table(s) 0–12; e.g. "×6 only" or "×2–×5 mixed".
  - Division: inverse of chosen multiplication tables; whole-number answers only; never divide by 0.
- **CM-03** Answer entry via on-screen number pad (large keys), not the system keyboard.
- **CM-04** Display both horizontal (`7 + 5 = ?`) and vertical (column) formats; parent picks default.
- **CM-05** Optional timed "Fact Sprint" (see `05`), off by default.
- **CM-06** SHOULD: visual aids on request — ten-frames / dots for addition up to 20, arrays for multiplication.
- **CM-07** COULD: multi-digit problems with regrouping, word problems, missing-number (`? + 4 = 9`).

### Geography (MUST)
- **CG-01** Bundled decks: U.S. states → capitals, capitals → states, state shapes/locations on a map, continents, oceans, world countries → capitals (by continent), flags.
- **CG-02** Map cards highlight the target region on an outline map; child picks from multiple choice or types.
- **CG-03** Multiple choice is the default for geography (typing "Tallahassee" is a spelling test, not a geography test). Typing is an option.
- **CG-04** Distractors come from the same region when possible (harder, more meaningful).
- **CG-05** Bundled map/flag assets must be public domain or permissively licensed; record sources.

### Sight words / reading (SHOULD)
- **CR-01** Bundled Dolch and Fry sight word lists by grade.
- **CR-02** Mode: word shown, child says it aloud, taps "I got it" / "Not yet" (self-check), with a "hear it" button.

### Custom decks (MUST)
- **CC-01** Parent creates any deck with free-form prompt/answer pairs (vocabulary, science terms, history dates, etc.).
- **CC-02** Import from CSV (`prompt,answer,hint`) and from pasted two-column text.
- **CC-03** Photo upload for prompts (e.g. a picture of a diagram from homework).

## Answer checking rules
- **AC-01** Trim whitespace; case-insensitive by default (per-deck toggle for case-sensitive).
- **AC-02** Accept listed alternates.
- **AC-03** Numbers: accept "12" and "12.0"; do not accept words ("twelve") unless listed.
- **AC-04** Spelling: exact match required (no fuzzy match) — the point is correct spelling.
- **AC-06** Fractions: see FR-02 (value and form).
- **AC-05** Non-spelling typed answers: SHOULD allow a 1-character typo with a "Close! Check your spelling: ____" message, counted as correct-with-note. Parent toggle.

## Built-in content bundle (v1)
- Math facts (generated)
- Fractions: Compare, Reduce, Improper ↔ mixed (generated)
- U.S. states & capitals, continents & oceans (world capitals and flags: later, per D-08)
- Dolch sight words (pre-K–3), Fry first 300
- 2–3 sample spelling decks by grade so the app isn't empty on first launch
