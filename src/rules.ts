// The building blocks of festival rules: which local day a tithi or a
// nakshatra "belongs to" under a given rule, which day a solar month
// starts on in each regional reckoning, and the bhadra (Vishti karana).

import { sunrise, sunset } from './astro.js';
import type { Location } from './location.js';
import {
  type Interval,
  type Kala,
  kalaWindow,
  nakshatraAt,
  overlap,
  sankranti,
} from './panchang.js';
import { addDays, type DateString, localDate } from './time.js';

const DAY_MS = 86_400_000;

/** Every local day from the one before `interval` starts to the one after it ends. */
function candidateDays(interval: Interval, loc: Location): DateString[] {
  const first = addDays(localDate(interval.start, loc.timeZone), -1);
  const last = addDays(localDate(interval.end, loc.timeZone), 1);
  const out: DateString[] = [];
  for (let d = first; d <= last; d = addDays(d, 1)) out.push(d);
  return out;
}

/**
 * The udaya rule: the day whose sunrise falls inside the interval (a
 * tithi or nakshatra "of the day" is the one current at sunrise).
 * When it spans two sunrises, `prefer` picks the first (default) or the
 * second. When it spans none (it begins and ends between two sunrises,
 * a kshaya), it belongs to the day on which it runs. With `minMuhurtas`, a
 * sunrise only counts when the interval lasts that many muhurtas after it.
 */
export function udayaDay(
  interval: Interval,
  loc: Location,
  prefer: 'first' | 'second' = 'first',
  minMuhurtas = 0
): DateString {
  const days = candidateDays(interval, loc);
  const hits = days.filter((d) => {
    const r = sunrise(d, loc);
    if (r < interval.start || r >= interval.end) return false;
    // With minMuhurtas, a tithi or star that ends within that many muhurtas
    // (fifteenths of daytime) of sunrise does not name the day.
    return minMuhurtas === 0 || interval.end - r >= (minMuhurtas * (sunset(d, loc) - r)) / 15;
  });
  if (hits.length > 0) return (prefer === 'second' ? hits[hits.length - 1] : hits[0]) as DateString;
  // Kshaya: the day whose sunrise is the last one before it starts.
  const before = days.filter((d) => sunrise(d, loc) < interval.start);
  return before[before.length - 1] as DateString;
}

export interface KalaHit {
  date: DateString;
  /** Milliseconds of the kala covered by the tithi. */
  covered: number;
  /** The kala window's length (0 for an instant). */
  length: number;
}

/** For each candidate day, how much of the kala the interval covers. */
export function kalaHits(interval: Interval, kala: Kala, loc: Location): KalaHit[] {
  const out: KalaHit[] = [];
  for (const date of candidateDays(interval, loc)) {
    const w = kalaWindow(kala, date, loc);
    if (!w) continue;
    const covered = overlap(interval, w);
    if (covered > 0) out.push({ date, covered, length: w.end - w.start });
  }
  return out;
}

export type TwoDayChoice = 'first' | 'second' | 'more' | 'second-if-3-muhurtas';

/**
 * The Vaishnava (ISKCON) day as observed in practice: the first day on
 * which the tithi is current at some moment of arunodaya, the 96 minutes
 * before sunrise, or at sunrise itself. A tithi that begins after sunrise
 * and lasts into the next dawn moves to the next day; one that touches no
 * dawn at all keeps the day it runs in.
 */
export function vaishnavaDay(interval: Interval, loc: Location): DateString {
  return kalaDay({ start: interval.start, end: interval.end }, 'arunodaya', loc, 'first');
}

/**
 * The vyapini rule: the day on which the tithi prevails during `kala`.
 * When it touches the kala on two days, `both` decides: the first day,
 * the second, or the one where it covers more of the kala. When it
 * touches the kala on no day, the udaya day is taken (or the day before
 * or after it, with `none`).
 */
export function kalaDay(
  interval: Interval,
  kala: Kala,
  loc: Location,
  both: TwoDayChoice = 'first',
  none: 'udaya' | 'before-start' = 'udaya'
): DateString {
  const hits = kalaHits(interval, kala, loc);
  if (hits.length === 1) return (hits[0] as KalaHit).date;
  if (hits.length >= 2) {
    const [a, b] = hits as [KalaHit, KalaHit];
    if (both === 'first') return a.date;
    if (both === 'second') return b.date;
    if (both === 'second-if-3-muhurtas') {
      // A tithi that lasts three muhurtas (a fifth of daytime) after the
      // second day's sunrise is that day's tithi.
      const rise = sunrise(b.date, loc);
      const muhurta = (sunset(b.date, loc) - rise) / 15;
      return interval.end - rise >= 3 * muhurta ? b.date : a.date;
    }
    return b.covered > a.covered ? b.date : a.date;
  }
  if (none === 'before-start') {
    // The day whose kala comes last before the tithi begins.
    const days = candidateDays(interval, loc).filter((d) => {
      const w = kalaWindow(kala, d, loc);
      return w !== null && w.end <= interval.start;
    });
    if (days.length) return days[days.length - 1] as DateString;
  }
  return udayaDay(interval, loc);
}

// --- Bhadra -----------------------------------------------------------------

/**
 * Vishti karana (bhadra) inside a tithi, or null. A tithi has two karanas
 * (halves); Vishti is the second half of Shukla Chaturthi and Ekadashi
 * and Krishna Tritiya and Dashami, and the first half of Shukla Ashtami
 * and Purnima and Krishna Saptami and Chaturdashi.
 */
export function bhadraIn(tithi: number, interval: Interval): Interval | null {
  const half = (interval.start + interval.end) / 2;
  const secondHalf = [4, 11, 18, 25];
  const firstHalf = [8, 15, 22, 29];
  if (secondHalf.includes(tithi)) return { start: half, end: interval.end };
  if (firstHalf.includes(tithi)) return { start: interval.start, end: half };
  return null;
}

/** The parts of `window` that are not inside `blocked`, longest first. */
export function minus(window: Interval, blocked: Interval | null): Interval[] {
  if (!blocked) return [window];
  const out: Interval[] = [];
  if (blocked.start > window.start)
    out.push({ start: window.start, end: Math.min(window.end, blocked.start) });
  if (blocked.end < window.end)
    out.push({ start: Math.max(window.start, blocked.end), end: window.end });
  return out.filter((x) => x.end > x.start);
}

// --- Solar months -----------------------------------------------------------

/**
 * When a solar month starts after its sankranti, by regional reckoning.
 * - `tamil`: the same day if the sankranti is before sunset, else the next.
 * - `malayalam`: the same day if it comes before the end of madhyahna
 *   (three fifths of daytime), else the next.
 * - `bengali`: the next day (the sankranti day itself closes the old month;
 *   a sankranti after midnight counts with the day before, which comes to
 *   the next civil day as well).
 * - `civil`: the local calendar day of the sankranti (Punjab, Odisha).
 * - `next-sunrise`: the day of the first sunrise after the sankranti.
 */
export type SolarReckoning = 'tamil' | 'malayalam' | 'bengali' | 'civil' | 'next-sunrise';

export function solarDay(at: number, loc: Location, reckoning: SolarReckoning): DateString {
  const d = localDate(at, loc.timeZone);
  switch (reckoning) {
    case 'civil':
      return d;
    case 'bengali':
      return addDays(d, 1);
    case 'tamil':
      return at < sunset(d, loc) ? d : addDays(d, 1);
    case 'malayalam': {
      const rise = sunrise(d, loc);
      const set = sunset(d, loc);
      if (at < rise) return d;
      return at < rise + (set - rise) * 0.6 ? d : addDays(d, 1);
    }
    case 'next-sunrise':
      return at < sunrise(d, loc) ? d : addDays(d, 1);
  }
}

/** The first day of the solar month of `rashi` that starts in `year`'s ingress. */
export function solarMonthStart(
  rashi: number,
  year: number,
  loc: Location,
  reckoning: SolarReckoning
): DateString {
  return solarDay(sankranti(rashi, year), loc, reckoning);
}

/** Every interval during which the Moon is in nakshatra `index`, between two instants. */
export function nakshatraIntervals(index: number, fromMs: number, toMs: number): Interval[] {
  const step = 3600_000;
  const out: Interval[] = [];
  const edge = (lo: number, hi: number, inside: boolean): number => {
    // Binary search for the instant the "in nakshatra" state flips.
    while (hi - lo > 1000) {
      const mid = (lo + hi) / 2;
      if ((nakshatraAt(mid) === index) === inside) lo = mid;
      else hi = mid;
    }
    return hi;
  };
  let t = fromMs;
  let inside = nakshatraAt(t) === index;
  let start = 0;
  if (inside) {
    // Walk back to the true start.
    let back = t;
    while (nakshatraAt(back - step) === index) back -= step;
    start = edge(back - step, back, false);
  }
  for (; t <= toMs + 2 * DAY_MS; t += step) {
    const now = nakshatraAt(t) === index;
    if (now && !inside) start = edge(t - step, t, false);
    if (!now && inside) {
      out.push({ start, end: edge(t - step, t, true) });
      if (t > toMs) break;
    }
    inside = now;
  }
  return out.filter((iv) => iv.end > fromMs && iv.start < toMs);
}
