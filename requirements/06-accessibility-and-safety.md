# 06 — Accessibility, Child Safety, and Privacy

## Accessibility (MUST)
- **AX-01** WCAG 2.2 AA for all screens.
- **AX-02** Full screen-reader support (VoiceOver, TalkBack, NVDA): every control labeled; cards announce prompt and result.
- **AX-03** Complete keyboard operation on web (Tab/Enter/Space; number keys for multiple choice and number pad).
- **AX-04** Read-aloud of prompts and choices via TTS; adjustable speed.
- **AX-05** Text size scaling to 200% without breaking layout.
- **AX-06** Dyslexia-friendly font option; extra letter spacing option.
- **AX-07** Reduce-motion respected (see `04`).
- **AX-08** Never rely on color alone; never rely on sound alone (visual equivalent for every sound).
- **AX-09** No time limits by default; any timed mode can be turned off.
- **AX-10** Touch targets ≥ 56 px on child screens.

## Child safety (MUST)
- **CS-01** No ads, no in-app purchases, no external links reachable from child screens.
- **CS-02** Parent area and settings locked behind a PIN; PIN entry uses a scrambled keypad or math question to deter kids watching.
- **CS-03** No chat, social, sharing, or user-to-user features.
- **CS-04** No camera/microphone access from child screens. Mic use (recording pronunciations) is parent-only, with a clear permission prompt.
- **CS-05** No push notifications to the child. Optional parent reminder notification ("Practice time?") off by default.
- **CS-06** Avatars are illustrated; no photos of the child.

## Privacy (MUST)
- **PR-01** All data stored locally on the device in v1. No server, no accounts.
- **PR-02** No analytics, crash reporting, or third-party SDKs that collect data, unless explicitly added later with parent opt-in.
- **PR-03** Only data collected: child first name (or nickname), grade, avatar choice, practice history.
- **PR-04** Parent can export and fully delete all data from Settings.
- **PR-05** If cloud sync is ever added, it must be designed for COPPA compliance (verifiable parental consent, data minimization, deletion on request) before launch.
- **PR-06** Include a plain-language privacy note in the parent area.
