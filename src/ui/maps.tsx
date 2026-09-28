// Outline maps (CG-02). Data loads lazily so it doesn't weigh down the first screen,
// and is precached by the service worker for offline use.
import { useEffect, useState } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { continentOf } from '../content/continents';

type Named = Feature<Geometry, { name: string }>;

let usCache: Named[] | null = null;
let worldCache: Named[] | null = null;

async function loadUS(): Promise<Named[]> {
  if (usCache) return usCache;
  const topo = (await import('us-atlas/states-albers-10m.json')).default as never as { objects: { states: never } };
  usCache = (feature(topo as never, topo.objects.states) as unknown as FeatureCollection<Geometry, { name: string }>).features;
  return usCache;
}

async function loadWorld(): Promise<Named[]> {
  if (worldCache) return worldCache;
  const topo = (await import('world-atlas/countries-110m.json')).default as never as { objects: { countries: never } };
  worldCache = (feature(topo as never, topo.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>).features;
  return worldCache;
}

export function UsMap({ highlight }: { highlight: string }) {
  const [states, setStates] = useState<Named[] | null>(usCache);
  useEffect(() => {
    if (!states) loadUS().then(setStates);
  }, [states]);
  if (!states) return <div className="map" style={{ aspectRatio: '975 / 610' }} aria-hidden />;
  const path = geoPath();
  const target = states.find((s) => s.properties.name === highlight);
  const [[x0, y0], [x1, y1]] = target ? path.bounds(target) : [[0, 0], [0, 0]];
  const [cx, cy] = target ? path.centroid(target) : [0, 0];
  const r = Math.max(22, Math.hypot(x1 - x0, y1 - y0) / 2 + 8);
  return (
    <svg className="map" viewBox="0 0 975 610" role="img" aria-label="Map of the United States with one state highlighted and circled">
      {states.map((s) => (
        <path key={s.properties.name} d={path(s) ?? ''} className={s === target ? 'hl' : ''} />
      ))}
      {target && <circle className="ring" cx={cx} cy={cy} r={r} />}
    </svg>
  );
}

const W = 960;
const H = 500;

export function WorldMap({ continent }: { continent: string }) {
  const [countries, setCountries] = useState<Named[] | null>(worldCache);
  useEffect(() => {
    if (!countries) loadWorld().then(setCountries);
  }, [countries]);
  if (!countries) return <div className="map" style={{ aspectRatio: `${W} / ${H}` }} aria-hidden />;
  const projection = geoNaturalEarth1().fitSize([W, H], { type: 'Sphere' } as never);
  const path = geoPath(projection);
  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="World map with one continent highlighted">
      <path d={path({ type: 'Sphere' } as never) ?? ''} style={{ fill: 'var(--math-tint)', stroke: 'none' }} />
      {countries.map((c, i) => (
        <path key={i} d={path(c) ?? ''} className={continentOf(c) === continent ? 'hl' : ''} />
      ))}
    </svg>
  );
}
