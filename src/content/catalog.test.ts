import { describe, expect, it } from 'vitest';
import { BUILTINS, builtinDeckId, suggestedDecks, suggestedSubjects } from './catalog';

describe('built-in catalog', () => {
  it('every built-in deck has cards with unique ids and answers', () => {
    const all = new Set<string>();
    for (const b of BUILTINS) {
      const cards = b.build(builtinDeckId(b.key));
      expect([b.key, cards.length > 0]).toEqual([b.key, true]);
      for (const c of cards) {
        expect(all.has(c.id)).toBe(false);
        all.add(c.id);
        expect(c.answer.length).toBeGreaterThan(0);
      }
    }
  });
  it('grade 3 suggestions include fractions, spelling, math and geography', () => {
    const keys = suggestedDecks(3, suggestedSubjects(3));
    expect(keys).toEqual(expect.arrayContaining(['spell-s3', 'mul0-5', 'reduce', 'to-mixed', 'cmp-same-d', 'us-capitals', 'continents-map', 'sight-g3']));
  });
});
