# Requirement Checklist

Status: ✅ built and checked · 🟡 partly done or needs a real-device check · ⏸ not built (optional or deferred)

How each item was checked: **U** = unit or component test, **E** = end-to-end test in Chrome (tablet and phone sizes), **A** = automated accessibility scan (axe, WCAG 2.2 AA), **V** = visual check from screenshots, **R** = code review only.

## 01 Product goals
| ID | Status | Notes |
|---|---|---|
| PO-01 | ✅ E | One child: Home → Today's Practice is one tap. Two children: avatar → Today's Practice is two taps. |
| PO-02 | ✅ E | Paste the list, tap Add to list, then Save. The test enters 15 words, and one pasted duplicate is dropped. |
| PO-03 | ✅ R | Defaults to 10 minutes or 15 cards; adjustable per child. |
| PO-04 | ✅ U | Leitner boxes; missed cards go back to box 1 and come back sooner. |
| PO-05 | ✅ E | The app reloads and runs with the network off, including maps. |
| PO-06 | ✅ R | No ads, purchases, analytics or third-party SDKs. |

## 02 Content
| ID | Status | Notes |
|---|---|---|
| CS-01 | ✅ U E | Accepts newlines, commas or `word \| sentence`, and removes duplicates. |
| CS-02 | ✅ R | Reads the word, then the sentence, then the word again. Speech can't be heard in the automated browser, so check it on a real device. |
| CS-03 | ✅ V | Hear it again, Slow (0.6×) and Sentence buttons. |
| CS-04 | ✅ U | Case-insensitive; spaces trimmed. |
| CS-05 | ✅ U E | Letter comparison uses strike-through and underline marks as well as color; the app says the word and spells it aloud. |
| CS-06 | ✅ R | Record, play and delete in the spelling editor; a recording replaces text-to-speech. Needs a real microphone to confirm. |
| CS-07 | ✅ R | Test Day: whole list, no hints, one try, results screen at the end. |
| CS-08 | ✅ E | The word is never shown before answering; it's blanked in the sentence. |
| CS-09 | ✅ R | With no voice available, shows the blanked sentence and first letter; the parent's Settings shows a warning. |
| CS-10 | ✅ V | Hint shows letter boxes first, then the first letter. |
| CS-11 | ✅ E | After a miss, the child must type the word correctly before Got it appears. |
| CS-12 | ✅ R | Look, Cover, Write: word shown for 3 seconds, then hidden. |
| CF-01..04 | ✅ U E V | Three sign buttons, all three levels, equal pairs, fraction bars, one-line reasoning after a miss. |
| RF-01..05 | ✅ U E | Fraction pad, always-reducible cards, "Almost — simpler?" retry, greatest-common-factor hint, whole-number answers. |
| IF-01..06 | ✅ U V | Both directions, simplest-form rule, circle pictures, "how many groups" hint. |
| FR-01..03 | ✅ U | Next-box arrow and Tab / `/` / space keys; checks value and form; denominator 0 rejected gently; Fact Sprint for Compare only. |
| CM-01..04 | ✅ U E | All four operations; no negatives; never ÷0; number pad; across or stacked layout. |
| CM-05 | ✅ R | 60-second sprint against your own best; available by default (D-10). |
| CM-06 | ✅ V | Show me: ten-frames, take-away dots, arrays. |
| CM-07 | ⏸ | Optional ("COULD"): multi-digit, word problems, missing-number. |
| CG-01 | ✅ | U.S. capitals both ways, name the highlighted state, continents on a map, continents quiz, oceans. World capitals and flags left out per D-08. |
| CG-02..04 | ✅ E V | Highlighted and circled map; multiple choice by default; wrong answers drawn from the same region. |
| CG-05 | ✅ R | Map sources listed in `CREDITS.md`. |
| CR-01 | ✅ | Original word sets for K–3, plus paste-your-school's-list (updated after the content-filter issue). |
| CR-02 | ✅ R | Flip card, "I got it" / "Not yet", Read it button. |
| CC-01..03 | ✅ U R | Free-form cards, CSV or pasted import, photo prompts. |
| AC-01..06 | ✅ U | All answer-checking rules have unit tests. |

## 03 Workflows
| ID | Status | Notes |
|---|---|---|
| WF-01 | ✅ E A | PIN entered twice, two children, subjects and decks by grade, "Skip — use suggestions". |
| WF-02..04 | ✅ E A | Missed cards come back later; Got it is required after a miss; summary; progress saved after every card; "Keep going?" to resume. |
| WF-05 / 05b | ✅ E | Spelling list and sight-word paste, test date, assign to children. |
| WF-06 / 06b / 07 | ✅ E | Math deck (preview count checked), fractions deck, custom deck. |
| WF-08 | 🟡 | Edit, archive, delete (with confirmation), reorder and pin all work. Built-in decks can be archived but not edited, because app updates refresh them; make a custom deck to change their content. |
| WF-09 | ✅ E | Week stats, test readiness, trouble cards with the actual wrong answers, focus, 4-week trend, card-by-card detail. |
| WF-10 | ✅ A | Every per-child and app-wide setting listed in the spec. |
| WF-11 | ✅ R | Avatar opens the profile picker; optional PIN to switch. |
| WF-12 | ✅ U | Export and import JSON backups, including recordings and photos. |
| Edge cases | ✅ | Resume, empty decks hidden, mastered badge, no-voice fallback, answer buttons lock after the first tap. |

## 04 Appearance
| Item | Status | Notes |
|---|---|---|
| S-01..S-08 | ✅ V | All screens built. |
| Colors, contrast | ✅ A | No axe contrast issues on the tested screens (light mode). Dark mode checked visually. |
| Fonts | ✅ | Andika (single-story a and g) for children, Lexend for grown-ups, OpenDyslexic as an option (downloaded only when turned on). |
| Touch targets ≥ 56 px | ✅ R | The `--tap` token is 56 px on child screens. |
| Motion, reduce motion | ✅ R | Card flip, star, celebration; replaced by fades when the device asks for reduced motion. |
| Sound | 🟡 | Soft synthesized effects with a toggle. Whether they follow the iPhone silent switch depends on the browser; check on the device. |
| Dark mode | ✅ V | Follows the device, with an override in Settings. |
| Phone layout | ✅ E V | Grown-ups tables stack into cards on narrow screens (fixed during testing). |

## 05 Learning & progress
All ✅ (unit tests plus end-to-end): Leitner boxes 1–5 with day-based intervals, mastery at box 5, 30-day review, Today's Practice order (focus → tests → due → new → review), at most ~40% new or box-1 cards, new cards mixed across subjects, missed cards back 3–5 cards later, always ending on a success, an easy card after 3 misses in a row, stars, weekly streak freeze, 40 stickers, daily time limit.

## 06 Accessibility, safety, privacy
| ID | Status | Notes |
|---|---|---|
| AX-01 | ✅ A | Zero axe violations on 12 screens. |
| AX-02 | 🟡 | Labels, live announcements and spoken fraction names are in place. Not yet tried with VoiceOver or TalkBack on a device. |
| AX-03 | ✅ U | Number keys, Enter, Backspace, Tab; 1–4 for choices; `<` `=` `>` for comparing. |
| AX-04 | ✅ R | Read it button on every card, including the answer choices; speed setting. |
| AX-05 | 🟡 | Text size setting (up to 1.5×) and layouts that reflow. Not yet checked at 200% browser zoom. |
| AX-06..10 | ✅ | Dyslexia font and spacing, reduced motion, sound always paired with a visual, no timers except the optional sprint, 56 px targets. |
| CS-01..04, CS-06 | ✅ | No links, chat or ads; scrambled PIN keypad with a 30-second lockout after 5 tries; microphone used only in the grown-ups area; illustrated avatars. |
| CS-05 | 🟡 | No notifications at all. The optional parent reminder (off by default) isn't built, because a web app can't schedule reminders reliably without a server. |
| PR-01..06 | ✅ | On-device only, no analytics, minimal data, export and delete all, privacy note in Settings. PR-05 applies only if sync is ever added. |

## 07 Technical
| ID | Status | Notes |
|---|---|---|
| TR-01..06 | ✅ | React 18 + TypeScript (strict) + Vite, CSS design tokens, Workbox service worker, Dexie/IndexedDB, Web Speech voice picker, no backend. |
| TR-07 | ✅ R | Plain web app that can later be wrapped with Capacitor. |
| Performance | 🟡 | Main bundle is 128 KB gzipped (budget 500 KB); maps load on demand. Not yet timed on a real tablet. |
| Tests | ✅ | 64 unit and component tests, 9 end-to-end tests, axe scans. The GitHub workflow runs them before every deploy. |

## Things to check on a real device
1. The spoken word → sentence → word order, and a recorded voice (iPad Safari).
2. Adding to the Home Screen, then opening it in airplane mode.
3. VoiceOver on one practice card.
4. Sound effects with the silent switch on.
