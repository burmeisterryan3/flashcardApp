// Built-in deck catalog (02 "Built-in content bundle") and grade-based suggestions (WF-01).
import type { Card, Deck, DeckType, GeneratorConfig, Mode, SubjectId } from '../engine/types';
import { generateFractionCards, generateMathCards } from '../engine/generators';
import { CONTINENTS, CONTINENT_NAMES, OCEANS, OCEAN_NAMES, STATES } from './geography';
import { SAMPLE_SPELLING, SIGHT_WORDS } from './words';

export interface Subject {
  id: SubjectId;
  name: string;
  /** CSS custom-property prefix, e.g. var(--spelling) */
  color: string;
  icon: 'spelling' | 'math' | 'fractions' | 'geography' | 'reading' | 'custom';
}

export const SUBJECTS: Subject[] = [
  { id: 'spelling', name: 'Spelling', color: 'spelling', icon: 'spelling' },
  { id: 'math', name: 'Math', color: 'math', icon: 'math' },
  { id: 'fractions', name: 'Fractions', color: 'fractions', icon: 'fractions' },
  { id: 'geography', name: 'Geography', color: 'geography', icon: 'geography' },
  { id: 'reading', name: 'Sight Words', color: 'reading', icon: 'reading' },
  { id: 'custom', name: 'My Decks', color: 'custom', icon: 'custom' },
];
export const subjectById = (id: SubjectId) => SUBJECTS.find((s) => s.id === id)!;

/** Modes available per deck type (first = default). */
export const MODES_FOR: Record<DeckType, Mode[]> = {
  spelling: ['spell', 'lcw', 'spell-test'],
  sight: ['flip', 'spell'],
  math: ['numpad', 'choice', 'sprint'],
  fraction: ['fraction'],
  geography: ['choice', 'type'],
  custom: ['flip', 'type', 'choice'],
};

export const MODE_LABEL: Record<Mode, string> = {
  spell: 'Hear & Spell',
  'spell-test': 'Test Day',
  lcw: 'Look, Cover, Write',
  numpad: 'Number pad',
  choice: 'Pick the answer',
  type: 'Type it',
  flip: 'Flip cards',
  compare: 'Compare',
  fraction: 'Fraction pad',
  sprint: 'Fact Sprint',
};

export interface BuiltinDef {
  key: string;
  subjectId: SubjectId;
  type: DeckType;
  name: string;
  /** Grades (0 = K) this deck is suggested for on setup. */
  grades: number[];
  modes?: Mode[];
  generatorConfig?: GeneratorConfig;
  build: (deckId: string) => Card[];
}

const base = (deckId: string, key: string, over: Partial<Card>): Card => ({
  id: `${deckId}|${key}`,
  deckId,
  kind: 'text',
  prompt: {},
  answer: '',
  alternates: [],
  tags: [],
  ...over,
});

const math = (key: string, name: string, grades: number[], cfg: Parameters<typeof generateMathCards>[1]): BuiltinDef => ({
  key,
  subjectId: 'math',
  type: 'math',
  name,
  grades,
  generatorConfig: { kind: 'math', math: cfg },
  build: (id) => generateMathCards(id, cfg),
});

const frac = (key: string, name: string, grades: number[], cfg: Parameters<typeof generateFractionCards>[1]): BuiltinDef => ({
  key,
  subjectId: 'fractions',
  type: 'fraction',
  name,
  grades,
  modes: cfg.skill === 'compare' ? ['compare', 'sprint'] : ['fraction'],
  generatorConfig: { kind: 'fraction', fraction: cfg },
  build: (id) => generateFractionCards(id, cfg),
});

const T = (n: number) => Array.from({ length: n + 1 }, (_, i) => i);

export const BUILTINS: BuiltinDef[] = [
  // Spelling samples
  ...Object.entries(SAMPLE_SPELLING).map(
    ([k, list]): BuiltinDef => ({
      key: `spell-${k}`,
      subjectId: 'spelling',
      type: 'spelling',
      name: list.name,
      grades: [list.grade],
      build: (id) =>
        list.words.map((w) =>
          base(id, `spell:${w.word}`, { kind: 'spell', answer: w.word, exampleSentence: w.sentence, prompt: {} }),
        ),
    }),
  ),

  // Math facts (D-07: grade 3 → add/sub facts to 20 + within 100, ×/÷ tables 0–10)
  math('add10', 'Addition facts to 10', [0, 1], { ops: ['add'], maxSum: 10, tables: [], display: 'horizontal' }),
  math('add20', 'Addition facts to 20', [1, 2, 3], { ops: ['add'], maxSum: 20, tables: [], display: 'horizontal' }),
  math('add100', 'Addition within 100', [2, 3], { ops: ['add'], maxSum: 100, tables: [], display: 'vertical' }),
  math('sub10', 'Subtraction facts to 10', [0, 1], { ops: ['sub'], maxSum: 10, tables: [], display: 'horizontal' }),
  math('sub20', 'Subtraction facts to 20', [1, 2, 3], { ops: ['sub'], maxSum: 20, tables: [], display: 'horizontal' }),
  math('sub100', 'Subtraction within 100', [2, 3], { ops: ['sub'], maxSum: 100, tables: [], display: 'vertical' }),
  math('mul0-5', 'Multiplication ×0 to ×5', [2, 3, 4], { ops: ['mul'], maxSum: 20, tables: [0, 1, 2, 3, 4, 5], display: 'horizontal' }),
  math('mul6-10', 'Multiplication ×6 to ×10', [3, 4], { ops: ['mul'], maxSum: 20, tables: [6, 7, 8, 9, 10], display: 'horizontal' }),
  math('div1-5', 'Division ÷1 to ÷5', [3, 4], { ops: ['div'], maxSum: 20, tables: [1, 2, 3, 4, 5], display: 'horizontal' }),
  math('div6-10', 'Division ÷6 to ÷10', [3, 4, 5], { ops: ['div'], maxSum: 20, tables: [6, 7, 8, 9, 10], display: 'horizontal' }),
  math('muldiv-mix', 'Multiply & divide mix', [4, 5], { ops: ['mul', 'div'], maxSum: 20, tables: T(10).slice(1), display: 'horizontal' }),

  // Fractions (IXL-style skill names, D-14)
  frac('cmp-same-d', 'Compare fractions: same denominator', [3, 4], { skill: 'compare', compareLevels: ['same-d'] }),
  frac('cmp-same-n', 'Compare fractions: same numerator', [3, 4], { skill: 'compare', compareLevels: ['same-n'] }),
  frac('cmp-unlike', 'Compare fractions: unlike denominators', [4, 5], { skill: 'compare', compareLevels: ['unlike'] }),
  frac('reduce', 'Reduce fractions to simplest form', [3, 4, 5], { skill: 'reduce' }),
  frac('to-mixed', 'Improper fractions to whole and mixed numbers', [3, 4, 5], { skill: 'improper', directions: ['to-mixed'] }),
  frac('to-improper', 'Mixed numbers to improper fractions', [4, 5], { skill: 'improper', directions: ['to-improper'] }),

  // Geography (D-08)
  {
    key: 'us-capitals',
    subjectId: 'geography',
    type: 'geography',
    name: 'U.S. state capitals',
    grades: [3, 4, 5],
    build: (id) =>
      STATES.map((s) =>
        base(id, `cap:${s.name}`, {
          kind: 'geo-map',
          prompt: { text: `What is the capital of ${s.name}?` },
          answer: s.capital,
          alternates: s.capitalAlt ?? [],
          group: s.region,
          tags: [s.region],
          data: { stateId: s.name },
          hint: `It's in the ${s.region}.`,
        }),
      ),
  },
  {
    key: 'us-capital-to-state',
    subjectId: 'geography',
    type: 'geography',
    name: 'Which state has this capital?',
    grades: [4, 5],
    build: (id) =>
      STATES.map((s) =>
        base(id, `cap2state:${s.name}`, {
          kind: 'text',
          prompt: { text: `${s.capital} is the capital of which state?` },
          answer: s.name,
          group: s.region,
          tags: [s.region],
          hint: `It's in the ${s.region}.`,
        }),
      ),
  },
  {
    key: 'us-find-state',
    subjectId: 'geography',
    type: 'geography',
    name: 'Name the highlighted state',
    grades: [2, 3, 4, 5],
    build: (id) =>
      STATES.map((s) =>
        base(id, `find:${s.name}`, {
          kind: 'geo-map',
          prompt: { text: 'Which state is highlighted?' },
          answer: s.name,
          group: s.region,
          tags: [s.region],
          data: { stateId: s.name },
          hint: `It's in the ${s.region}.`,
        }),
      ),
  },
  {
    key: 'continents-map',
    subjectId: 'geography',
    type: 'geography',
    name: 'Continents on the map',
    grades: [1, 2, 3, 4, 5],
    build: (id) =>
      CONTINENT_NAMES.map((c) =>
        base(id, `cmap:${c}`, {
          kind: 'geo-map',
          prompt: { text: 'Which continent is highlighted?' },
          answer: c,
          choicePool: CONTINENT_NAMES,
          data: { continent: c },
        }),
      ),
  },
  {
    key: 'continents-quiz',
    subjectId: 'geography',
    type: 'geography',
    name: 'Continents quiz',
    grades: [0, 1, 2, 3],
    build: (id) =>
      CONTINENTS.map((q, i) =>
        base(id, `cq:${i}`, {
          prompt: { text: q.q },
          answer: q.a,
          choicePool: q.a === '7' ? ['5', '6', '7', '8'] : CONTINENT_NAMES,
          hint: q.hint,
        }),
      ),
  },
  {
    key: 'oceans',
    subjectId: 'geography',
    type: 'geography',
    name: 'Oceans',
    grades: [2, 3, 4, 5],
    build: (id) =>
      OCEANS.map((q, i) =>
        base(id, `oc:${i}`, {
          prompt: { text: q.q },
          answer: q.a,
          choicePool: q.a === '5' ? ['3', '4', '5', '7'] : OCEAN_NAMES,
        }),
      ),
  },

  // Sight words (original sets, CR-01)
  ...Object.entries(SIGHT_WORDS).map(
    ([k, set]): BuiltinDef => ({
      key: `sight-${k}`,
      subjectId: 'reading',
      type: 'sight',
      name: set.name,
      grades: set.grade === 3 ? [3] : [set.grade, set.grade + 1],
      build: (id) =>
        set.words.map((w) => base(id, `sight:${w}`, { kind: 'sight', prompt: { text: w }, answer: w })),
    }),
  ),
];

export const builtinDeckId = (key: string) => `builtin:${key}`;

export function builtinDeck(def: BuiltinDef, order: number, assigned: string[], now: number): Deck {
  const modes = def.modes ?? MODES_FOR[def.type];
  return {
    id: builtinDeckId(def.key),
    subjectId: def.subjectId,
    name: def.name,
    type: def.type,
    modesAllowed: modes,
    defaultMode: modes[0],
    generatorConfig: def.generatorConfig ?? { kind: 'builtin', key: def.key },
    isBuiltIn: true,
    archived: false,
    assignedChildIds: assigned,
    sprintEnabled: modes.includes('sprint'),
    order,
    createdAt: now,
    updatedAt: now,
  };
}

/** Subjects pre-checked on setup (WF-01 step 4). */
export function suggestedSubjects(grade: number): SubjectId[] {
  if (grade <= 1) return ['spelling', 'math', 'geography', 'reading', 'custom'];
  if (grade === 2) return ['spelling', 'math', 'geography', 'reading', 'custom'];
  return ['spelling', 'math', 'fractions', 'geography', 'reading', 'custom'];
}

/** Suggested built-in decks for a grade & chosen subjects (WF-01 step 5). */
export function suggestedDecks(grade: number, subjects: SubjectId[]): string[] {
  return BUILTINS.filter((b) => subjects.includes(b.subjectId) && b.grades.includes(grade)).map((b) => b.key);
}
