// List parsing for spelling (CS-01, WF-05) and custom import (CC-02); distractors (CG-04).
import type { Card } from './types';
import { shuffle, type Rng } from './session';

export interface ParsedWord {
  word: string;
  sentence?: string;
}

/** Split on newlines/commas, trim, drop blanks and duplicates. "word | sentence" per line. */
export function parseSpellingList(text: string): ParsedWord[] {
  const out: ParsedWord[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    if (line.includes('|')) {
      const [w, ...rest] = line.split('|');
      add(w, rest.join('|'));
    } else {
      for (const w of line.split(/[,;\t]/)) add(w);
    }
  }
  function add(raw: string, sentence?: string) {
    const word = raw.trim().replace(/^\d+[.)]\s*/, ''); // drop "1." numbering
    if (!word) return;
    const key = word.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    const s = sentence?.trim();
    out.push(s ? { word, sentence: s } : { word });
  }
  return out;
}

export interface ParsedPair {
  prompt: string;
  answer: string;
  hint?: string;
}

/** CSV (`prompt,answer,hint`, quotes supported) or tab / " - " / ":" separated text. */
export function parseCardImport(text: string): ParsedPair[] {
  const out: ParsedPair[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    let cols: string[];
    if (line.includes('\t')) cols = line.split('\t');
    else if (line.includes(',')) cols = parseCsvLine(line);
    else if (line.includes(' - ')) cols = line.split(' - ');
    else if (line.includes(':')) cols = line.split(':');
    else continue;
    const [prompt, answer, hint] = cols.map((c) => c.trim());
    if (!prompt || !answer) continue;
    if (/^prompt$/i.test(prompt) && /^answer$/i.test(answer)) continue; // header row
    out.push(hint ? { prompt, answer, hint } : { prompt, answer });
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') {
      cols.push(cur);
      cur = '';
    } else cur += ch;
  }
  cols.push(cur);
  return cols;
}

/** The example sentence with the target word blanked (CS-08). */
export function blankSentence(sentence: string, word: string): string {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return sentence.replace(new RegExp(`\\b${esc}\\b`, 'gi'), '_____');
}

/**
 * Multiple choice options (CG-04): prefer distractors from the same group,
 * never duplicates of the answer. `count` includes the correct answer.
 */
export function buildChoices(card: Card, deckCards: Card[], count: number, rng: Rng = Math.random): string[] {
  const answer = card.answer;
  const pool = card.choicePool ?? deckCards.map((c) => c.answer);
  const uniq = (xs: string[]) => [...new Set(xs)].filter((x) => x.toLowerCase() !== answer.toLowerCase());
  const same = uniq(
    card.group ? deckCards.filter((c) => c.group === card.group && c.id !== card.id).map((c) => c.answer) : [],
  ).filter((x) => pool.includes(x));
  const others = uniq(pool).filter((x) => !same.includes(x));
  let distractors = [...shuffle(same, rng), ...shuffle(others, rng)];
  if (card.kind === 'math') distractors = mathDistractors(Number(answer), rng);
  return shuffle([answer, ...distractors.slice(0, count - 1)], rng);
}

function mathDistractors(ans: number, rng: Rng): string[] {
  const cands = new Set<number>();
  for (const d of [1, -1, 2, -2, 10, -10, 5, -5]) if (ans + d >= 0) cands.add(ans + d);
  return shuffle([...cands], rng).map(String);
}
