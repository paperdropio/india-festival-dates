// A small panchang: tithi, nakshatra, lunar months (amanta and purnimanta,
// with adhik maas), sankrantis and the parts of the day the festival rules
// refer to. Tithis, months and sankrantis are moments that are the same
// everywhere; only the local day they land on depends on the place.

import {
  elongation,
  moonSidereal,
  nextNewMoon,
  previousNewMoon,
  searchElongation,
  searchSunSidereal,
  sunSidereal,
  sunrise,
  sunset,
  moonrise,
} from './astro.js';
import type { Location } from './location.js';
import { addDays, type DateString } from './time.js';

const DAY_MS = 86_400_000;

/** Lunar months, amanta numbering: 0 = Chaitra … 11 = Phalguna. */
export const MONTHS = [
  'Chaitra',
  'Vaishakha',
  'Jyeshtha',
  'Ashadha',
  'Shravana',
  'Bhadrapada',
  'Ashwin',
  'Kartika',
  'Margashirsha',
  'Pausha',
  'Magha',
  'Phalguna',
] as const;

/** Signs of the sidereal zodiac, 0 = Mesha (Aries). */
export const RASHIS = [
  'Mesha',
  'Vrishabha',
  'Mithuna',
  'Karka',
  'Simha',
  'Kanya',
  'Tula',
  'Vrischika',
  'Dhanu',
  'Makara',
  'Kumbha',
  'Meena',
] as const;

export const NAKSHATRAS = [
  'Ashwini',
  'Bharani',
  'Krittika',
  'Rohini',
  'Mrigashira',
  'Ardra',
  'Punarvasu',
  'Pushya',
  'Ashlesha',
  'Magha',
  'Purva Phalguni',
  'Uttara Phalguni',
  'Hasta',
  'Chitra',
  'Swati',
  'Vishakha',
  'Anuradha',
  'Jyeshtha',
  'Mula',
  'Purva Ashadha',
  'Uttara Ashadha',
  'Shravana',
  'Dhanishta',
  'Shatabhisha',
  'Purva Bhadrapada',
  'Uttara Bhadrapada',
  'Revati',
] as const;

export const TITHIS = [
  'Pratipada',
  'Dwitiya',
  'Tritiya',
  'Chaturthi',
  'Panchami',
  'Shashthi',
  'Saptami',
  'Ashtami',
  'Navami',
  'Dashami',
  'Ekadashi',
  'Dwadashi',
  'Trayodashi',
  'Chaturdashi',
  'Purnima',
] as const;

/** Tithi number at an instant: 1–15 Shukla (15 = Purnima), 16–30 Krishna (30 = Amavasya). */
export function tithiAt(ms: number): number {
  return Math.floor(elongation(ms) / 12) + 1;
}

/** Nakshatra index (0 = Ashwini … 26 = Revati) of the Moon at an instant. */
export function nakshatraAt(ms: number): number {
  return Math.floor(moonSidereal(ms) / (360 / 27));
}

/** Sidereal sign of the Sun (0 = Mesha) at an instant. */
export function sunRashiAt(ms: number): number {
  return Math.floor(sunSidereal(ms) / 30);
}

export function tithiName(tithi: number): string {
  if (tithi === 30) return 'Amavasya';
  const paksha = tithi <= 15 ? 'Shukla' : 'Krishna';
  return `${paksha} ${TITHIS[(tithi - 1) % 15]}`;
}

export interface Interval {
  start: number;
  end: number;
}

/** A lunar month from one new moon to the next (amanta). */
export interface LunarMonth {
  /** 0 = Chaitra … 11 = Phalguna. */
  month: number;
  /** An adhik (extra) month: no sankranti falls in it. */
  adhik: boolean;
  /** The new moon that starts it. */
  start: number;
  /** The new moon that ends it. */
  end: number;
}

const newMoonCache = new Map<number, number[]>();

/** New moons from shortly before 1 January of `year` to shortly after it ends. */
function newMoonsAround(year: number): number[] {
  const hit = newMoonCache.get(year);
  if (hit) return hit;
  const from = Date.UTC(year, 0, 1) - 80 * DAY_MS;
  const to = Date.UTC(year + 1, 0, 1) + 80 * DAY_MS;
  const list: number[] = [previousNewMoon(from)];
  for (;;) {
    const last = list[list.length - 1] as number;
    if (last > to) break;
    list.push(nextNewMoon(last + DAY_MS));
  }
  newMoonCache.set(year, list);
  return list;
}

const monthCache = new Map<number, LunarMonth[]>();

/**
 * The amanta lunar months overlapping `year` (with a margin either side).
 *
 * A month takes the name of the month after the sign the Sun is in at the
 * new moon that starts it: Sun in Meena at the new moon, the month is
 * Chaitra (the month in which the Sun enters Mesha). When the Sun is in
 * the same sign at both new moons, no sankranti falls in the month and it
 * is adhik, named after the month that follows it. (A kshaya month, with
 * two sankrantis, simply skips a name.)
 */
export function lunarMonthsAround(year: number): LunarMonth[] {
  const hit = monthCache.get(year);
  if (hit) return hit;
  const moons = newMoonsAround(year);
  const months: LunarMonth[] = [];
  for (let i = 0; i + 1 < moons.length; i++) {
    const start = moons[i] as number;
    const end = moons[i + 1] as number;
    const r0 = sunRashiAt(start);
    const r1 = sunRashiAt(end);
    const adhik = r0 === r1;
    months.push({ month: (r0 + 1) % 12, adhik, start, end });
  }
  monthCache.set(year, months);
  return months;
}

/** The lunar month containing an instant. */
export function lunarMonthAt(ms: number): LunarMonth {
  const year = new Date(ms).getUTCFullYear();
  const m = lunarMonthsAround(year).find((x) => x.start <= ms && ms < x.end);
  if (!m) throw new Error('No lunar month found');
  return m;
}

/** The interval of tithi `tithi` (1–30) within a lunar month. */
export function tithiInMonth(month: LunarMonth, tithi: number): Interval {
  const start = tithi === 1 ? month.start : searchElongation(12 * (tithi - 1), month.start, 32);
  const end = tithi === 30 ? month.end : searchElongation(12 * tithi, month.start, 32);
  return { start, end };
}

/**
 * The purnimanta month name for an instant: the Krishna paksha belongs to
 * the month after its amanta one (North India's reckoning).
 */
export function purnimantaMonth(month: number, tithi: number): number {
  return tithi > 15 ? (month + 1) % 12 : month;
}

const sankrantiCache = new Map<string, number>();

/** The sankranti at which the Sun enters `rashi` (0 = Mesha) in `year` (UTC year of the instant). */
export function sankranti(rashi: number, year: number): number {
  const key = `${rashi}|${year}`;
  const hit = sankrantiCache.get(key);
  if (hit !== undefined) return hit;
  // Mesha is mid-April; each later sign about 30.4 days on. Start well before.
  const approx = Date.UTC(year, 3, 14) + rashi * 30.44 * DAY_MS;
  let from = approx - 20 * DAY_MS;
  // Signs from Makara on fall early in the next calendar year; bring them back.
  while (new Date(from + 20 * DAY_MS).getUTCFullYear() > year) from -= 365.2422 * DAY_MS;
  const t = searchSunSidereal(rashi * 30, from, 60);
  sankrantiCache.set(key, t);
  return t;
}

// --- Parts of the day ------------------------------------------------------

/** The named times of day the festival rules use. */
export type Kala =
  | 'sunrise'
  | 'six-nazhika'
  | 'arunodaya'
  | 'purvahna'
  | 'madhyahna'
  | 'aparahna'
  | 'sayahna'
  | 'sunset'
  | 'pradosh'
  | 'nishita'
  | 'moonrise';

/**
 * The window of a kala on a local day. The day (sunrise to sunset) is cut
 * into five equal parts: pratah, sangava, madhyahna, aparahna, sayahna;
 * purvahna here is the first half of the day. The night (sunset to the
 * next sunrise) is cut into fifteen muhurtas: pradosh is its first fifth
 * (three muhurtas), nishita its eighth muhurta. Arunodaya is the four
 * ghatis (96 minutes) before sunrise; six-nazhika is the moment six
 * nazhikas (144 minutes) after sunrise, which Kerala uses to name a day's
 * star. Instants (sunrise, sunset, moonrise, six-nazhika) are windows of
 * zero length. Moonrise is null on a day without one.
 */
export function kalaWindow(kala: Kala, date: DateString, loc: Location): Interval | null {
  const rise = sunrise(date, loc);
  const set = sunset(date, loc);
  const day = set - rise;
  const part = (a: number, b: number): Interval => ({ start: rise + day * a, end: rise + day * b });
  switch (kala) {
    case 'sunrise':
      return { start: rise, end: rise };
    case 'sunset':
      return { start: set, end: set };
    case 'six-nazhika':
      return { start: rise + 144 * 60_000, end: rise + 144 * 60_000 };
    case 'arunodaya':
      return { start: rise - 96 * 60_000, end: rise };
    case 'purvahna':
      return part(0, 0.5);
    case 'madhyahna':
      return part(0.4, 0.6);
    case 'aparahna':
      return part(0.6, 0.8);
    case 'sayahna':
      return part(0.8, 1);
    case 'pradosh':
    case 'nishita': {
      const next = sunrise(addDays(date, 1), loc);
      const night = next - set;
      return kala === 'pradosh'
        ? { start: set, end: set + night / 5 }
        : { start: set + (night * 7) / 15, end: set + (night * 8) / 15 };
    }
    case 'moonrise': {
      const m = moonrise(date, loc);
      return m === null ? null : { start: m, end: m };
    }
  }
}

/** How long two intervals overlap (ms). A zero-length window inside counts as 1 ms. */
export function overlap(a: Interval, b: Interval): number {
  const lo = Math.max(a.start, b.start);
  const hi = Math.min(a.end, b.end);
  if (hi > lo) return hi - lo;
  const point = (x: Interval) => x.start === x.end;
  if ((point(a) || point(b)) && hi >= lo && lo === hi) return 1;
  return 0;
}

// --- A day's panchang -------------------------------------------------------

export interface DayPanchang {
  date: DateString;
  sunrise: number;
  sunset: number;
  moonrise: number | null;
  /** The tithi at sunrise (1–30) and when it ends. */
  tithi: { number: number; name: string; ends: number };
  /** The nakshatra at sunrise and when it ends. */
  nakshatra: { index: number; name: string; ends: number };
  /** The amanta month of sunrise, and the purnimanta name. */
  month: { amanta: string; purnimanta: string; adhik: boolean };
  /** The Sun's sidereal sign at sunrise. */
  sunSign: string;
}

function nextChange(ms: number, value: (t: number) => number, stepMs: number): number {
  const v = value(ms);
  let lo = ms;
  let hi = ms + stepMs;
  while (value(hi) === v) {
    lo = hi;
    hi += stepMs;
  }
  while (hi - lo > 1000) {
    const mid = (lo + hi) / 2;
    if (value(mid) === v) lo = mid;
    else hi = mid;
  }
  return Math.round(hi);
}

/** The panchang of a local day at a place, read at sunrise. */
export function dayPanchang(date: DateString, loc: Location): DayPanchang {
  const rise = sunrise(date, loc);
  const t = tithiAt(rise);
  const n = nakshatraAt(rise);
  const lm = lunarMonthAt(rise);
  const purn = purnimantaMonth(lm.month, t);
  return {
    date,
    sunrise: rise,
    sunset: sunset(date, loc),
    moonrise: moonrise(date, loc),
    tithi: { number: t, name: tithiName(t), ends: nextChange(rise, tithiAt, 3 * 3600_000) },
    nakshatra: {
      index: n,
      name: NAKSHATRAS[n] as string,
      ends: nextChange(rise, nakshatraAt, 3 * 3600_000),
    },
    month: {
      amanta: MONTHS[lm.month] as string,
      purnimanta: MONTHS[purn] as string,
      adhik: lm.adhik,
    },
    sunSign: RASHIS[sunRashiAt(rise)] as string,
  };
}
