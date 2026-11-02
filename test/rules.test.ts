import { describe, expect, it } from 'vitest';

import { sunrise, sunset } from '../src/astro.js';
import { PRESETS } from '../src/location.js';
import { kalaWindow } from '../src/panchang.js';
import { bhadraIn, kalaDay, minus, solarDay, udayaDay, vaishnavaDay } from '../src/rules.js';

const delhi = PRESETS['new-delhi'];
const H = 3600_000;

describe('udaya rule', () => {
  const rise = sunrise('2026-03-10', delhi);
  const nextRise = sunrise('2026-03-11', delhi);

  it('takes the day whose sunrise the interval covers', () => {
    expect(udayaDay({ start: rise - H, end: rise + 20 * H }, delhi)).toBe('2026-03-10');
  });

  it('takes the first of two sunrises, or the second when asked', () => {
    const iv = { start: rise - H, end: nextRise + H };
    expect(udayaDay(iv, delhi)).toBe('2026-03-10');
    expect(udayaDay(iv, delhi, 'second')).toBe('2026-03-11');
  });

  it('gives a kshaya interval (no sunrise) to the day it runs in', () => {
    expect(udayaDay({ start: rise + 2 * H, end: rise + 20 * H }, delhi)).toBe('2026-03-10');
  });

  it('ignores a sunrise the interval outlasts by less than a muhurta, when asked', () => {
    const iv = { start: rise + 2 * H, end: nextRise + 10 * 60_000 };
    expect(udayaDay(iv, delhi)).toBe('2026-03-11');
    expect(udayaDay(iv, delhi, 'first', 1)).toBe('2026-03-10');
  });
});

describe('kala (vyapini) rule', () => {
  const d1 = '2026-03-10';
  const d2 = '2026-03-11';
  const pradosh1 = kalaWindow('pradosh', d1, delhi)!;
  const pradosh2 = kalaWindow('pradosh', d2, delhi)!;

  it('takes the only day whose kala the interval touches', () => {
    expect(kalaDay({ start: pradosh1.start - H, end: pradosh1.end + H }, 'pradosh', delhi)).toBe(d1);
  });

  it('chooses between two days', () => {
    const iv = { start: pradosh1.end - 10 * 60_000, end: pradosh2.end };
    expect(kalaDay(iv, 'pradosh', delhi, 'first')).toBe(d1);
    expect(kalaDay(iv, 'pradosh', delhi, 'second')).toBe(d2);
    expect(kalaDay(iv, 'pradosh', delhi, 'more')).toBe(d2);
  });

  it('falls back to the evening before when it touches none', () => {
    const iv = { start: pradosh1.end + H, end: pradosh2.start - H };
    expect(kalaDay(iv, 'pradosh', delhi, 'first', 'before-start')).toBe(d1);
  });
});

describe('Vaishnava rule', () => {
  it('moves a tithi that begins after sunrise and lasts into the next dawn to the next day', () => {
    const rise = sunrise('2026-03-10', delhi);
    expect(vaishnavaDay({ start: rise + H, end: rise + 23.5 * H }, delhi)).toBe('2026-03-11');
    expect(vaishnavaDay({ start: rise - 30 * 60_000, end: rise + 22 * H }, delhi)).toBe('2026-03-10');
  });
});

describe('bhadra', () => {
  it('is the first half of Purnima and the second half of Shukla Chaturthi', () => {
    const iv = { start: 0, end: 20 * H };
    expect(bhadraIn(15, iv)).toEqual({ start: 0, end: 10 * H });
    expect(bhadraIn(4, iv)).toEqual({ start: 10 * H, end: 20 * H });
    expect(bhadraIn(1, iv)).toBeNull();
  });

  it('cuts a window around it', () => {
    expect(minus({ start: 0, end: 10 }, { start: 3, end: 5 })).toEqual([
      { start: 0, end: 3 },
      { start: 5, end: 10 },
    ]);
    expect(minus({ start: 0, end: 10 }, { start: -5, end: 20 })).toEqual([]);
  });
});

describe('solar month reckonings', () => {
  const d = '2026-04-14';
  const rise = sunrise(d, delhi);
  const set = sunset(d, delhi);
  const morning = rise + 2 * H;
  const evening = set + 2 * H;
  const night = sunrise('2026-04-15', delhi) - 2 * H; // 15 April, before sunrise

  it('civil: the local day of the ingress', () => {
    expect(solarDay(morning, delhi, 'civil')).toBe(d);
    expect(solarDay(night, delhi, 'civil')).toBe('2026-04-15');
  });

  it('tamil: the same day before sunset, else the next', () => {
    expect(solarDay(morning, delhi, 'tamil')).toBe(d);
    expect(solarDay(evening, delhi, 'tamil')).toBe('2026-04-15');
  });

  it('malayalam: the same day before the end of madhyahna, else the next', () => {
    expect(solarDay(morning, delhi, 'malayalam')).toBe(d);
    expect(solarDay(rise + (set - rise) * 0.7, delhi, 'malayalam')).toBe('2026-04-15');
  });

  it('bengali: the next day', () => {
    expect(solarDay(morning, delhi, 'bengali')).toBe('2026-04-15');
    expect(solarDay(night, delhi, 'bengali')).toBe('2026-04-16');
  });

  it('next-sunrise: the first sunrise after the ingress', () => {
    expect(solarDay(morning, delhi, 'next-sunrise')).toBe('2026-04-15');
    expect(solarDay(night, delhi, 'next-sunrise')).toBe('2026-04-15');
  });
});
