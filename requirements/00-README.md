# Flash Card App — Requirements Package

A flash card app for an elementary-age child (grades K–5) to practice schoolwork: spelling, math facts, geography, and custom topics a parent adds over time.

## How to use this package
These files are the specification for building the app. Read them in order. When something conflicts, the lower-numbered file wins, except `08-open-decisions.md`, which records choices that override defaults elsewhere once answered.

| File | Covers |
|---|---|
| `01-product-overview.md` | Goals, users, scope, success criteria |
| `02-content-and-subjects.md` | Subjects, card types, deck structure, built-in content |
| `03-workflows.md` | Every user flow, step by step |
| `04-appearance-and-ui.md` | Visual design, layout, screens, motion, sound |
| `05-learning-and-progress.md` | Spaced repetition, scoring, rewards, reports |
| `06-accessibility-and-safety.md` | Accessibility, child safety, privacy |
| `07-technical-requirements.md` | Platform, architecture, data model, offline, testing |
| `08-open-decisions.md` | Choices still to make, with recommended defaults |

## Conventions
- **MUST** = required for v1. **SHOULD** = strongly desired for v1. **COULD** = later version.
- Requirement IDs (e.g. `WF-03`) let you reference items in feedback: "change WF-03 so…".
- "Child" = the learner. "Parent" = the adult who manages content and settings.
