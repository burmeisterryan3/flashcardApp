import { describe, expect, it } from 'vitest';
import { feature } from 'topojson-client';
import world from 'world-atlas/countries-110m.json';
import { continentOf } from './continents';

describe('continent assignment', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fc = feature(world as any, (world as any).objects.countries) as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const by = (n: string) => continentOf(fc.features.find((f: any) => f.properties.name === n));
  it('classifies well-known countries', () => {
    const expected: Record<string, string> = {
      'United States of America': 'North America', Mexico: 'North America', Panama: 'North America', Cuba: 'North America', Greenland: 'North America',
      Brazil: 'South America', Colombia: 'South America', Venezuela: 'South America', Chile: 'South America',
      Egypt: 'Africa', Somalia: 'Africa', Madagascar: 'Africa', Morocco: 'Africa', Kenya: 'Africa', Eritrea: 'Africa',
      Spain: 'Europe', Iceland: 'Europe', Ukraine: 'Europe', Italy: 'Europe', France: 'Europe', 'United Kingdom': 'Europe',
      China: 'Asia', India: 'Asia', 'Saudi Arabia': 'Asia', Israel: 'Asia', Indonesia: 'Asia', Japan: 'Asia', Russia: 'Asia', Turkey: 'Asia',
      Australia: 'Australia', 'New Zealand': 'Australia', 'Papua New Guinea': 'Australia',
      Antarctica: 'Antarctica',
    };
    for (const [n, c] of Object.entries(expected)) expect([n, by(n)]).toEqual([n, c]);
  });
  it('every country gets one of the 7 continents', () => {
    const set = new Set(fc.features.map(continentOf));
    expect(set.size).toBe(7);
  });
});
