# 04 — Appearance and UI

## Design principles
1. **Friendly, not babyish.** Should feel fine to a 5-year-old and not embarrass a 10-year-old.
2. **One thing at a time.** One card, one question, one big action per screen.
3. **Icons + words.** Every child-facing button has an icon and a label.
4. **Mistakes are safe.** No red X's, buzzers, or losing points for wrong answers.
5. **Calm by default.** Motion and sound are short and purposeful; nothing flashes or loops.

## Visual style
- **Look:** soft, rounded, flat illustration style; generous white space; chunky shapes.
- **Corner radius:** 16–24 px on cards and buttons.
- **Shadows:** subtle, one level; cards feel like physical cards.
- **Mascot (SHOULD):** one original friendly character (e.g. an owl or fox) who appears on Home, feedback, and celebrations. Must be an original design.

### Color
- Neutral warm background (off-white in light mode; deep navy in dark mode).
- **Subject colors** (each needs light/dark variants and must pass contrast with its text):
  | Subject | Color family |
  |---|---|
  | Spelling | Purple |
  | Math | Blue |
  | Fractions | Pink / rose |
  | Geography | Green |
  | Reading / sight words | Orange |
  | Custom | Teal |
- **Feedback:** correct = green; try-again = amber/yellow; never pure red for the child's mistakes.
- All text meets WCAG AA (4.5:1 body, 3:1 large text).
- Color is never the only signal (always paired with icon/text).

### Typography
- Rounded, highly legible sans-serif (e.g. Nunito, Andika, or Lexend — Andika and Lexend are designed for early readers).
- Single-story "a" and "g" preferred (matches how kids learn to write letters).
- Sizes (child screens): card prompt 40–64 px, answers/buttons 24–32 px, minimum anything 18 px.
- Parent screens use normal app sizes (16 px base).
- Optional dyslexia-friendly font toggle.

### Iconography
- Simple filled icons, consistent set (e.g. Phosphor or Lucide filled style). Subject icons: ✏️ spelling, ➕ math, 🌎 geography, 📖 reading, ⭐ custom (drawn, not emoji, in the final build).

## Layout
- Target devices: tablet (primary), phone, and laptop browser.
- **Touch targets ≥ 56×56 px** on child screens (above the 44 px adult standard — small fingers).
- Portrait and landscape both supported; practice screen optimized for both.
- Parent area can use denser, standard layouts.

## Screens

### S-01 Profile picker
Grid of large avatar circles with names. Small "Grown-ups" lock icon in a corner.

### S-02 Child Home
- Top: greeting ("Hi, Sam!"), avatar, streak flame, star count.
- Hero: huge **Today's Practice** button with a progress ring toward the daily goal.
- Below: subject tiles (color + icon + name), each with a small mastery indicator.
- Bottom corner: sticker book button. Grown-ups gear is small and out of the way.

### S-03 Deck list (per subject)
Cards/tiles per deck showing name, card count, and a 3-level mastery badge (seedling → sprout → tree, or similar). "Test Friday!" tag when a test date is set.

### S-04 Practice screen
- Top bar: progress dots or bar (card 4 of 12), pause button. No countdown timer unless sprint mode.
- Center: the card (large, centered, ~70% of width).
- Below card: input area (number pad, keyboard field, choices, or flip button).
- Utility row: 🔊 replay, 💡 hint.
- Multiple choice: 2–4 options (2–3 for K–1, 4 for grades 2+), stacked on phone, 2×2 grid on tablet.
- Number pad: 3×4 layout, digits 0–9, backspace, big **Check** button.
- Typing: large input, system keyboard with autocorrect/autocapitalize/spellcheck **off** (critical for spelling).

### S-05 Feedback states (in-place on the practice screen)
- Correct: card border glows green, check icon, star flies to the progress bar.
- Try again: card turns soft amber, correct answer revealed below the child's answer, letter-diff for spelling, **Got it** button.

### S-06 Session summary
Mascot celebration, stars earned, cards practiced, new words learned, sticker unlocked. **Practice more** / **All done**.

### S-07 Sticker book
Grid of collectible stickers, locked ones shown as silhouettes.

### S-08 Parent area (behind PIN)
Tabs: **Progress · Decks · Children · Settings**. Standard, efficient adult UI; not themed for kids beyond the shared palette.

## Motion
- Card flip: 3D flip, 300–400 ms.
- Card enter/exit: slide/fade, ≤ 250 ms.
- Celebrations: ≤ 1.5 s, skippable by tap.
- Respect the OS "reduce motion" setting: replace flips/flies with fades.
- Nothing flashes more than 3 times per second.

## Sound
- Short, soft effects: tap, correct chime, gentle "try again" tone (not a buzzer), celebration jingle.
- Separate toggles: sound effects, spoken prompts.
- Never plays sound unexpectedly outside a practice session.
- Respects device mute where the platform allows.

## Voice & copy tone
- Warm, short, encouraging, specific. Grade-1 reading level on child screens.
- Correct: "Yes!", "Nice work!", "You got it!" (rotate; no overpraise).
- Incorrect: "Almost! Here's the answer.", "Let's look together.", "Good try — this one's tricky."
- Praise effort and progress ("You practiced 5 days in a row!") more than raw scores.
- Never: "Wrong!", "Fail", scores framed as grades, comparisons between siblings.

## Dark mode
SHOULD support light/dark following the OS, with a manual override in parent settings.
