import { describe, expect, it } from 'vitest';

import { sunrise, sunset } from '../src/astro.js';
import { PRESETS } from '../src/location.js';
import {
  MONTHS,
  dayPanchang,
  kalaWindow,
  lunarMonthsAround,
  nakshatraAt,
  purnimantaMonth,
  tithiAt,
  tithiInMonth,
  tithiName,
} from '../src/panchang.js';

const delhi = PRESETS['new-delhi'];

describe('tithi and nakshatra', () => {
  it('numbers tithis 1–30 and names them', () => {
    expect(tithiName(1)).toBe('Shukla Pratipada');
    expect(tithiName(15)).toBe('Shukla Purnima');
    expect(tithiName(23)).toBe('Krishna Ashtami');
    expect(tithiName(30)).toBe('Amavasya');
  });

  it('reads tithi 15 just before a full moon and 16 just after', () => {
    const full = Date.UTC(2026, 2, 3, 11, 38);
    expect(tithiAt(full - 30 * 60_000)).toBe(15);
    expect(tithiAt(full + 30 * 60_000)).toBe(16);
  });

  it('keeps nakshatras in 0–26', () => {
    for (let d = 0; d < 30; d++) {
      const n = nakshatraAt(Date.UTC(2026, 0, 1 + d));
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThanOrEqual(26);
    }
  });
});

describe('lunar months', () => {
  it('runs new moon to new moon in order, every name in turn', () => {
    const months = lunarMonthsAround(2025);
    for (let i = 1; i < months.length; i++) {
      const prev = months[i - 1]!;
      const m = months[i]!;
      expect(m.start).toBe(prev.end);
      if (!m.adhik) {
        const expected = prev.adhik ? prev.month : (prev.month + 1) % 12;
        expect(m.month).toBe(expected);
      }
    }
  });

  it('finds the adhik Jyeshtha of 2026', () => {
    const adhik = lunarMonthsAround(2026).filter((m) => m.adhik && new Date(m.start).getUTCFullYear() === 2026);
    expect(adhik.map((m) => MONTHS[m.month])).toEqual(['Jyeshtha']);
  });

  it('has no adhik month in 2025', () => {
    const adhik = lunarMonthsAround(2025).filter((m) => m.adhik && new Date(m.start).getUTCFullYear() === 2025);
    expect(adhik).toEqual([]);
  });

  it('splits a month into thirty tithis', () => {
    const m = lunarMonthsAround(2026).find((x) => x.month === 6 && !x.adhik)!;
    let prevEnd = m.start;
    for (let t = 1; t <= 30; t++) {
      const iv = tithiInMonth(m, t);
      expect(iv.start).toBe(prevEnd);
      expect(iv.end).toBeGreaterThan(iv.start);
      expect(tithiAt((iv.start + iv.end) / 2)).toBe(t);
      prevEnd = iv.end;
    }
    expect(prevEnd).toBe(m.end);
  });

  it('gives the Krishna paksha the next month in the purnimanta reckoning', () => {
    expect(purnimantaMonth(6, 10)).toBe(6);
    expect(purnimantaMonth(6, 19)).toBe(7);
    expect(purnimantaMonth(11, 20)).toBe(0);
  });
});

describe('parts of the day', () => {
  it('orders the kalas through the day and night', () => {
    const d = '2026-11-08';
    const rise = sunrise(d, delhi);
    const set = sunset(d, delhi);
    const w = (k: Parameters<typeof kalaWindow>[0]) => kalaWindow(k, d, delhi)!;
    expect(w('arunodaya').end).toBe(rise);
    expect(w('purvahna').start).toBe(rise);
    expect(w('madhyahna').start).toBeLessThan(w('aparahna').start);
    expect(w('aparahna').end).toBeLessThan(set);
    expect(w('pradosh').start).toBe(set);
    expect(w('nishita').start).toBeGreaterThan(w('pradosh').end);
    // Nishita sits around local midnight.
    const mid = (w('nishita').start + w('nishita').end) / 2;
    expect(Math.abs(mid - Date.UTC(2026, 10, 8, 18, 30) - 12 * 60_000)).toBeLessThan(60 * 60_000);
  });
});

describe('day panchang', () => {
  it('describes a day', () => {
    const p = dayPanchang('2026-11-08', delhi);
    expect(p.sunrise).toBeLessThan(p.sunset);
    expect(p.tithi.ends).toBeGreaterThan(p.sunrise);
    expect(p.nakshatra.ends).toBeGreaterThan(p.sunrise);
    expect(MONTHS).toContain(p.month.amanta);
    expect(p.tithi.name).toBe(tithiName(p.tithi.number));
  });
});
