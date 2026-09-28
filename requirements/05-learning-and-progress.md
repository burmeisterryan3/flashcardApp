# 05 — Learning Engine, Rewards, and Progress

## Learning model: Leitner boxes (MUST)
A simple, explainable spaced-repetition system suitable for kids.

- Each card, per child, lives in **Box 1–5**. New cards start in Box 1.
- **Correct (first try, no hint):** move up one box.
- **Correct with hint or after a miss:** stay in current box.
- **Incorrect:** move to Box 1.
- **Review intervals:** Box 1 = every session, Box 2 = 1 day, Box 3 = 3 days, Box 4 = 7 days, Box 5 = 14 days.
- Card is **mastered** when it reaches Box 5 and is answered correctly there once.
- Mastered cards still appear occasionally (every ~30 days) to keep them fresh.

Mastery levels shown to users: **Learning** (Box 1–2), **Getting there** (Box 3–4), **Mastered** (Box 5).

## Building "Today's Practice" (MUST)
Default session: 15 cards or 10 minutes, whichever comes first (configurable).

Selection order:
1. Cards the parent flagged "focus".
2. Cards from decks with a test date in the next 5 days (higher weight as the date approaches).
3. Cards that are due by their box interval, lowest box first.
4. Up to 3–5 **new** cards per session (introduce slowly).
5. Fill remaining slots with due review from other active decks, mixing subjects.

Rules:
- Never more than ~40% new/Box-1 cards in one session (avoid frustration).
- Shuffle, but don't show the same card twice in a row.
- Missed cards requeue 3–5 cards later (WF-03).
- End on a success: if the last card is missed, append an easy (high-box) card.

## Timed "Fact Sprint" (SHOULD — available by default per D-10)
- 60-second round of math facts. Goal: beat your **own** previous best.
- Wrong answers don't subtract points.
- Available by default for math and fraction-compare decks (D-10); the parent can turn it off per child or per deck (timed pressure causes anxiety for some kids).
- Sprint answers are recorded for the parent view but do not move Leitner boxes (speed practice, not learning checks).

## Rewards (MUST)
- **Stars:** 1 per correct card; bonus 3 for finishing a session.
- **Streak:** consecutive days meeting the daily goal. Includes **one "freeze" per week** so one missed day doesn't reset it (avoids punishing kids for family schedules).
- **Stickers:** unlocked by milestones (first session, 5-day streak, deck mastered, 100 stars, etc.). ~40 stickers in v1.
- Rewards are for effort and mastery; never tied to speed unless in Sprint mode.
- No currency, store, or purchasable anything.

## Data recorded per attempt
child_id, card_id, deck_id, timestamp, mode, answer given, correct (bool), used_hint (bool), attempt number in session, response time (ms).

## Parent progress view (MUST)
- **This week:** days practiced, minutes, cards practiced, streak.
- **Per deck:** mastery % (Mastered / Getting there / Learning), last practiced.
- **Trouble cards:** most-missed in the last 14 days, with the child's actual wrong answers (useful: e.g. always writes "becuase").
- **Upcoming tests:** decks with test dates and readiness % (share of deck in Box 3+).
- **Trend chart:** accuracy over the last 4 weeks per subject.

## Guardrails
- Daily time limit option (parent); gentle "Great work today — time for a break!" when reached.
- If the child misses 3 cards in a row, next card is drawn from easier/known cards and the mascot offers encouragement.
