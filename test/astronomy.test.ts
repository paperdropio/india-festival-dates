// Sanity checks of the astronomy layer. The reference instants are
// astronomy-engine's own results or public-domain facts (eclipses, the
// definition of the Lahiri ayanamsa).

import { describe, expect, it } from 'vitest';

import {
  elongation,
  lahiriAyanamsa,
  moonSidereal,
  nextNewMoon,
  searchElongation,
  searchSunSidereal,
  sunSidereal,
  sunrise,
  sunset,
} from '../src/astro.js';
import { PRESETS } from '../src/location.js';
import { localDate, localTime } from '../src/time.js';

const MIN = 60_000;

describe('Lahiri ayanamsa', () => {
  it('matches its definition on 21 March 1956', () => {
    // 23°15'00.658" with nutation; 23.245524743° without, at JD 2435553.5.
    expect(lahiriAyanamsa(Date.UTC(1956, 2, 21))).toBeCloseTo(23.2455, 3);
  });

  it('grows with precession, about 50.3" a year', () => {
    const a = lahiriAyanamsa(Date.UTC(2000, 0, 1, 12));
    const b = lahiriAyanamsa(Date.UTC(2026, 0, 1, 12));
    expect(a).toBeCloseTo(23.857, 2);
    expect((b - a) * 3600).toBeGreaterThan(26 * 50.2);
    expect((b - a) * 3600).toBeLessThan(26 * 50.4);
  });
});

describe('Moon phases', () => {
  it('finds the new moon of the total solar eclipse of 8 April 2024', () => {
    const t = nextNewMoon(Date.UTC(2024, 3, 1));
    expect(Math.abs(t - Date.UTC(2024, 3, 8, 18, 21))).toBeLessThan(3 * MIN);
  });

  it('finds the full moon of the total lunar eclipse of 3 March 2026', () => {
    const t = searchElongation(180, Date.UTC(2026, 1, 25));
    expect(Math.abs(t - Date.UTC(2026, 2, 3, 11, 38))).toBeLessThan(5 * MIN);
  });

  it('elongation runs 0–360 and passes 12° about a day after new moon', () => {
    const nm = nextNewMoon(Date.UTC(2026, 0, 1));
    expect(elongation(nm + MIN)).toBeLessThan(1);
    const t = searchElongation(12, nm);
    expect(t - nm).toBeGreaterThan(19 * 3600_000);
    expect(t - nm).toBeLessThan(27 * 3600_000);
  });
});

describe('sankranti', () => {
  it('finds the ingress into sidereal Makara in mid-January', () => {
    for (const year of [2000, 2026, 2050]) {
      const t = searchSunSidereal(270, Date.UTC(year, 0, 1));
      expect(sunSidereal(t)).toBeCloseTo(270, 4);
      const d = localDate(t, 'Asia/Kolkata');
      expect(d >= `${year}-01-13` && d <= `${year}-01-16`).toBe(true);
    }
  });

  it('puts Mesha sankranti between 13 and 15 April for decades', () => {
    for (let year = 1990; year <= 2060; year += 7) {
      const t = searchSunSidereal(0, Date.UTC(year, 2, 1));
      const d = localDate(t, 'Asia/Kolkata');
      expect(d >= `${year}-04-13` && d <= `${year}-04-15`).toBe(true);
    }
  });

  it('keeps the Moon and Sun sidereal longitudes in range', () => {
    const t = Date.UTC(2026, 5, 1);
    for (const x of [moonSidereal(t), sunSidereal(t)]) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(360);
    }
  });
});

describe('sunrise and sunset', () => {
  it('gives New Delhi a midsummer sunrise around 05:24 and sunset around 19:22', () => {
    const delhi = PRESETS['new-delhi'];
    const rise = localTime(sunrise('2026-06-21', delhi), delhi.timeZone);
    const set = localTime(sunset('2026-06-21', delhi), delhi.timeZone);
    expect(rise >= '05:20' && rise <= '05:28').toBe(true);
    expect(set >= '19:18' && set <= '19:26').toBe(true);
  });

  it('gives Sydney a short winter day', () => {
    const sydney = PRESETS.sydney;
    const day = sunset('2026-06-21', sydney) - sunrise('2026-06-21', sydney);
    expect(day / 3600_000).toBeGreaterThan(9.7);
    expect(day / 3600_000).toBeLessThan(10.1);
  });
});
