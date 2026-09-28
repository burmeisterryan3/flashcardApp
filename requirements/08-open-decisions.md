# 08 — Open Decisions (resolved)

Blank answers use the **Default**. The **Resolved** column is what the build uses.

| # | Question | Default | Parent decision | Resolved |
|---|---|---|---|---|
| D-01 | Devices | Mix → PWA | — | Mix of tablet, phone, computer |
| D-02 | Web app or native | PWA | — | PWA |
| D-03 | Child's grade(s) | — | 3 | Grade 3 (profiles still support K–5) |
| D-04 | Child profiles | 1 | 2 | 2 profiles set up in onboarding; up to 4 supported |
| D-05 | Sync across devices | No | No | No — export/import only |
| D-06 | Must-have subjects | All five | — | Spelling, math, fractions, geography, sight words, custom |
| D-07 | Math range | Grade-based | — | Grade 3: add/sub within 100 (facts to 20 by default), ×/÷ tables 0–10 |
| D-08 | Geography focus | US states & capitals + continents | — | US states & capitals, continents, oceans |
| D-09 | Session length | 10 min / 15 cards | — | 10 minutes or 15 cards, whichever first |
| D-10 | Timed Fact Sprint | Off | Yes | Available; enabled by default for math decks (parent can turn off per child) |
| D-11 | Mascot | Owl | — | Original owl character ("Hoot") |
| D-12 | Parent voice recording | Yes | — | Yes |
| D-13 | Typo tolerance (non-spelling) | Yes | — | Yes |
| D-14 | School program | None | IXL | IXL — skill names in built-in decks use IXL-style grade-3 groupings (e.g. "Compare fractions") so they line up with homework; no IXL content or branding is copied |
| D-15 | Accessibility needs | None | None | None specific; baseline accessibility still applies |
| D-16 | Hosting | GitHub Pages / Netlify | GitHub Pages | GitHub Pages (static build, relative base path, GitHub Actions deploy workflow) |

## Future ideas (not v1)
- Cloud sync and parent phone app
- Teacher-shared decks / import from class list
- Photo-of-worksheet → auto-create deck
- Handwriting input for spelling (Apple Pencil)
- Multi-digit and word-problem math
- Printable flash cards (PDF) from any deck
- Weekly progress email to parent
- Fraction addition/subtraction, mixed-number arithmetic
