// Assigns each country in world-atlas (Natural Earth, public domain) to a continent for the
// "Which continent is highlighted?" deck. Uses the country's centroid plus a few overrides —
// good enough for an elementary map where continents are shown as blocks of color.
import { geoCentroid } from 'd3-geo';
import type { Feature, Geometry } from 'geojson';

export type Continent =
  | 'Africa'
  | 'Antarctica'
  | 'Asia'
  | 'Australia'
  | 'Europe'
  | 'North America'
  | 'South America';

const OVERRIDES: Record<string, Continent> = {
  Turkey: 'Asia',
  'Timor-Leste': 'Asia',
  Eritrea: 'Africa',
  'Fr. S. Antarctic Lands': 'Antarctica',
  Russia: 'Asia',
  France: 'Europe',
  Norway: 'Europe',
  Fiji: 'Australia',
  'New Caledonia': 'Australia',
};

export function continentFromPoint(lon: number, lat: number): Continent {
  if (lat < -60) return 'Antarctica';
  if (lon < -30) return lat > 7.5 ? 'North America' : 'South America';
  if (lon > 110 && lat < -5) return 'Australia';
  if (lat < 37 && lon < 52 && !(lat > 12.5 && lon > 34.5)) return 'Africa';
  if (lon < 40 && lat > 35) return 'Europe';
  return 'Asia';
}

export function continentOf(f: Feature<Geometry, { name?: string }>): Continent {
  const name = f.properties?.name ?? '';
  if (OVERRIDES[name]) return OVERRIDES[name];
  const [lon, lat] = geoCentroid(f);
  return continentFromPoint(lon, lat);
}
