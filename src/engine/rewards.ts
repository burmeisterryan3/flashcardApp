// Stars, streaks (with weekly freeze) and stickers (05 "Rewards").
import type { Rewards } from './types';

export function dayStr(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDays(s: string, n: number): string {
  const [y, m, d] = s.split('-').map(Number);
  return dayStr(new Date(y, m - 1, d + n).getTime());
}

/** ISO-ish week key (Monday start) used to reset the weekly freeze. */
export function weekKey(t: number): string {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0
  d.setDate(d.getDate() - day);
  return dayStr(d.getTime());
}

export function newRewards(childId: string): Rewards {
  return {
    childId,
    stars: 0,
    streakDays: 0,
    freezesLeft: 1,
    stickersUnlocked: [],
    sessionsCompleted: 0,
    decksMastered: [],
    sprintBest: {},
    testsPerfect: 0,
  };
}

function refreshFreeze(r: Rewards, now: number): Rewards {
  const wk = weekKey(now);
  return r.freezeWeek === wk ? r : { ...r, freezeWeek: wk, freezesLeft: 1 };
}

/** Call when the child meets the daily goal. One missed day is covered by the week's freeze. */
export function recordGoalMet(r0: Rewards, now: number): Rewards {
  const r = refreshFreeze(r0, now);
  const today = dayStr(now);
  if (r.lastGoalDate === today) return r;
  let streak = 1;
  let freezesLeft = r.freezesLeft;
  if (r.lastGoalDate === addDays(today, -1)) streak = r.streakDays + 1;
  else if (r.lastGoalDate === addDays(today, -2) && freezesLeft > 0) {
    streak = r.streakDays + 1;
    freezesLeft -= 1;
  }
  return { ...r, streakDays: streak, lastGoalDate: today, freezesLeft };
}

/** Streak as it should be displayed today (0 if it has lapsed). */
export function displayStreak(r0: Rewards, now: number): number {
  const r = refreshFreeze(r0, now);
  if (!r.lastGoalDate) return 0;
  const today = dayStr(now);
  if (r.lastGoalDate === today || r.lastGoalDate === addDays(today, -1)) return r.streakDays;
  if (r.lastGoalDate === addDays(today, -2) && r.freezesLeft > 0) return r.streakDays;
  return 0;
}

export interface StickerStats {
  rewards: Rewards;
  masteredCards: number;
  subjectsPracticed: string[];
  spellingCorrect: number;
  mathCorrect: number;
  fractionCorrect: number;
  geoCorrect: number;
  readingCorrect: number;
}

export interface Sticker {
  id: string;
  emoji: string;
  name: string;
  how: string;
  test: (s: StickerStats) => boolean;
}

const st = (id: string, emoji: string, name: string, how: string, test: Sticker['test']): Sticker => ({ id, emoji, name, how, test });

/** 40 stickers (05). Effort & mastery, not speed — except the sprint ones. */
export const STICKERS: Sticker[] = [
  st('first', '🐣', 'First Steps', 'Finish your first practice', (s) => s.rewards.sessionsCompleted >= 1),
  st('s3', '🌱', 'Growing', 'Finish 3 practices', (s) => s.rewards.sessionsCompleted >= 3),
  st('s10', '🌻', 'Sunflower', 'Finish 10 practices', (s) => s.rewards.sessionsCompleted >= 10),
  st('s25', '🌳', 'Mighty Tree', 'Finish 25 practices', (s) => s.rewards.sessionsCompleted >= 25),
  st('s50', '🏔️', 'Mountain', 'Finish 50 practices', (s) => s.rewards.sessionsCompleted >= 50),
  st('s100', '🚀', 'Rocket', 'Finish 100 practices', (s) => s.rewards.sessionsCompleted >= 100),
  st('st2', '🔥', 'Warm Up', '2 days in a row', (s) => s.rewards.streakDays >= 2),
  st('st5', '🌟', 'Five Alive', '5 days in a row', (s) => s.rewards.streakDays >= 5),
  st('st10', '🌈', 'Rainbow', '10 days in a row', (s) => s.rewards.streakDays >= 10),
  st('st20', '🦄', 'Unicorn', '20 days in a row', (s) => s.rewards.streakDays >= 20),
  st('st30', '👑', 'Crown', '30 days in a row', (s) => s.rewards.streakDays >= 30),
  st('star25', '⭐', 'Star Catcher', 'Earn 25 stars', (s) => s.rewards.stars >= 25),
  st('star100', '💫', 'Star Collector', 'Earn 100 stars', (s) => s.rewards.stars >= 100),
  st('star250', '🌠', 'Shooting Star', 'Earn 250 stars', (s) => s.rewards.stars >= 250),
  st('star500', '🌌', 'Galaxy', 'Earn 500 stars', (s) => s.rewards.stars >= 500),
  st('star1000', '☀️', 'Supernova', 'Earn 1,000 stars', (s) => s.rewards.stars >= 1000),
  st('m10', '🧩', 'Puzzle Piece', 'Master 10 cards', (s) => s.masteredCards >= 10),
  st('m50', '🧠', 'Big Brain', 'Master 50 cards', (s) => s.masteredCards >= 50),
  st('m150', '📚', 'Bookworm', 'Master 150 cards', (s) => s.masteredCards >= 150),
  st('deck1', '🏆', 'Deck Champ', 'Master a whole deck', (s) => s.rewards.decksMastered.length >= 1),
  st('deck3', '🥇', 'Triple Champ', 'Master 3 decks', (s) => s.rewards.decksMastered.length >= 3),
  st('sp10', '✏️', 'Pencil Pro', 'Spell 10 words right', (s) => s.spellingCorrect >= 10),
  st('sp50', '🐝', 'Spelling Bee', 'Spell 50 words right', (s) => s.spellingCorrect >= 50),
  st('sp150', '📝', 'Word Wizard', 'Spell 150 words right', (s) => s.spellingCorrect >= 150),
  st('test1', '💯', 'Test Ace', 'Get every word right on a Test Day', (s) => s.rewards.testsPerfect >= 1),
  st('ma25', '➕', 'Number Buddy', '25 math facts right', (s) => s.mathCorrect >= 25),
  st('ma100', '🔢', 'Math Whiz', '100 math facts right', (s) => s.mathCorrect >= 100),
  st('ma300', '🧮', 'Abacus Ace', '300 math facts right', (s) => s.mathCorrect >= 300),
  st('fr10', '🍕', 'Pizza Slicer', '10 fraction cards right', (s) => s.fractionCorrect >= 10),
  st('fr50', '🥧', 'Pie Expert', '50 fraction cards right', (s) => s.fractionCorrect >= 50),
  st('fr150', '🍰', 'Fraction Master', '150 fraction cards right', (s) => s.fractionCorrect >= 150),
  st('ge10', '🧭', 'Explorer', '10 geography cards right', (s) => s.geoCorrect >= 10),
  st('ge50', '🗺️', 'Map Reader', '50 geography cards right', (s) => s.geoCorrect >= 50),
  st('ge150', '🌎', 'Globetrotter', '150 geography cards right', (s) => s.geoCorrect >= 150),
  st('rd25', '📖', 'Reader', '25 sight words right', (s) => s.readingCorrect >= 25),
  st('rd100', '🦉', 'Wise Owl', '100 sight words right', (s) => s.readingCorrect >= 100),
  st('mix3', '🎨', 'All-Rounder', 'Practice 3 different subjects', (s) => s.subjectsPracticed.length >= 3),
  st('mix5', '🎪', 'Everything!', 'Practice 5 different subjects', (s) => s.subjectsPracticed.length >= 5),
  st('sprint10', '⚡', 'Lightning', 'Answer 10 in a Fact Sprint', (s) => Object.values(s.rewards.sprintBest).some((v) => v >= 10)),
  st('sprint25', '🐆', 'Cheetah', 'Answer 25 in a Fact Sprint', (s) => Object.values(s.rewards.sprintBest).some((v) => v >= 25)),
];

export function newlyUnlocked(stats: StickerStats): Sticker[] {
  return STICKERS.filter((s) => !stats.rewards.stickersUnlocked.includes(s.id) && s.test(stats));
}
