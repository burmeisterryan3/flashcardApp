// Core data types (07-technical-requirements.md, data model).

export type SubjectId = 'spelling' | 'math' | 'fractions' | 'geography' | 'reading' | 'custom';

export type DeckType = 'spelling' | 'math' | 'fraction' | 'geography' | 'sight' | 'custom';

/** How a card is answered on screen. */
export type Mode =
  | 'spell' // Hear & Spell (read-aloud spelling)
  | 'spell-test' // Test day
  | 'lcw' // Look, Cover, Write
  | 'numpad' // number pad
  | 'choice' // multiple choice
  | 'type' // type the answer
  | 'flip' // flip & self-check
  | 'compare' // < = > buttons for fractions
  | 'fraction' // stacked fraction / mixed-number entry
  | 'sprint'; // 60-second fact sprint

export type CardKind =
  | 'text'
  | 'spell'
  | 'sight'
  | 'math'
  | 'frac-compare'
  | 'frac-reduce'
  | 'frac-to-mixed'
  | 'mixed-to-improper'
  | 'geo-map';

export type Frac = { n: number; d: number };
export type Mixed = { w: number; n: number; d: number };

export type MathOp = 'add' | 'sub' | 'mul' | 'div';

export interface CardData {
  // math
  a?: number;
  b?: number;
  op?: MathOp;
  // fractions
  f1?: Frac;
  f2?: Frac;
  mixed?: Mixed;
  // geography map
  stateId?: string;
}

export interface Card {
  id: string;
  deckId: string;
  kind: CardKind;
  prompt: { text?: string; imageRef?: string; audioRef?: string };
  answer: string;
  alternates: string[];
  hint?: string;
  exampleSentence?: string;
  tags: string[];
  data?: CardData;
  /** Group name used for picking multiple-choice distractors (CG-04). */
  group?: string;
  /** Explicit multiple-choice pool; defaults to all answers in the deck. */
  choicePool?: string[];
}

export interface MathConfig {
  ops: MathOp[];
  /** add/sub: facts up to this sum / minuend. */
  maxSum: 10 | 20 | 100;
  /** mul/div tables to include (0–12). */
  tables: number[];
  display: 'horizontal' | 'vertical';
}

export interface FractionConfig {
  skill: 'compare' | 'reduce' | 'improper';
  compareLevels?: Array<'same-d' | 'same-n' | 'unlike'>;
  includeSimplest?: boolean;
  directions?: Array<'to-mixed' | 'to-improper'>;
}

export type GeneratorConfig =
  | { kind: 'math'; math: MathConfig }
  | { kind: 'fraction'; fraction: FractionConfig }
  | { kind: 'builtin'; key: string };

export interface Deck {
  id: string;
  subjectId: SubjectId;
  name: string;
  type: DeckType;
  modesAllowed: Mode[];
  defaultMode: Mode;
  testDate?: string; // yyyy-mm-dd
  generatorConfig?: GeneratorConfig;
  isBuiltIn: boolean;
  archived: boolean;
  assignedChildIds: string[];
  caseSensitive?: boolean;
  sprintEnabled?: boolean;
  pinned?: boolean;
  order: number;
  createdAt: number;
  updatedAt: number;
}

export interface ChildSettings {
  sessionCards: number;
  sessionMinutes: number;
  dailyGoalCards: number;
  audioAutoplay: boolean;
  soundEffects: boolean;
  sprintAllowed: boolean;
  hintsAllowed: boolean;
  typoTolerance: boolean;
  fontScale: number; // 1, 1.25, 1.5
  dyslexiaFont: boolean;
  extraSpacing: boolean;
  dailyLimitMinutes: number; // 0 = none
  speechRate: number; // 0.6 – 1.2
}

export interface ChildProfile {
  id: string;
  name: string;
  grade: number; // 0 = K
  avatarId: string;
  settings: ChildSettings;
  createdAt: number;
}

export interface CardProgress {
  key: string; // `${childId}|${cardId}`
  childId: string;
  cardId: string;
  deckId: string;
  box: number; // 1–5
  dueAt: number;
  timesSeen: number;
  timesCorrect: number;
  lastSeenAt: number;
  mastered: boolean;
  focus: boolean;
}

export interface Attempt {
  id?: number;
  childId: string;
  cardId: string;
  deckId: string;
  sessionId: string;
  timestamp: number;
  mode: Mode;
  answerGiven: string;
  correct: boolean;
  usedHint: boolean;
  attemptNo: number;
  responseMs: number;
}

export interface Session {
  id: string;
  childId: string;
  startedAt: number;
  endedAt?: number;
  cardsPlanned: number;
  cardsDone: number;
  starsEarned: number;
  completed: boolean;
  kind: 'today' | 'deck' | 'sprint' | 'test';
}

export interface Rewards {
  childId: string;
  stars: number;
  streakDays: number;
  lastGoalDate?: string; // yyyy-mm-dd
  freezesLeft: number;
  freezeWeek?: string; // ISO week the freeze belongs to
  stickersUnlocked: string[];
  sessionsCompleted: number;
  decksMastered: string[];
  sprintBest: Record<string, number>;
  testsPerfect: number;
}

export interface ParentSettings {
  id: 'parent';
  pinHash: string;
  pinSalt: string;
  theme: 'system' | 'light' | 'dark';
  voiceURI?: string;
  requirePinToSwitch: boolean;
  onboarded: boolean;
}

export const DEFAULT_CHILD_SETTINGS: ChildSettings = {
  sessionCards: 15,
  sessionMinutes: 10,
  dailyGoalCards: 15,
  audioAutoplay: true,
  soundEffects: true,
  sprintAllowed: true, // D-10: parent said yes
  hintsAllowed: true,
  typoTolerance: true, // D-13
  fontScale: 1,
  dyslexiaFont: false,
  extraSpacing: false,
  dailyLimitMinutes: 0,
  speechRate: 0.9,
};
