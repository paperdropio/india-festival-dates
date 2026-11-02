// india-festival-dates: Indian festival dates calculated from astronomy
// (astronomy-engine) and written-down festival rules, for any year and any
// place. Built by Paperdrop Corp for Twinden.

import type { Festival, FestivalDays } from './festival.js';
import { HINDU_FESTIVALS } from './festivals/hindu.js';
import { OTHER_FESTIVALS } from './festivals/other.js';
import { SOLAR_FESTIVALS } from './festivals/solar.js';
import { type Location, PRESETS, type PresetName } from './location.js';
import { type DayPanchang, dayPanchang } from './panchang.js';
import type { DateString } from './time.js';

export type { Festival, FestivalDays, Tradition } from './festival.js';
export type { Location, PresetName } from './location.js';
export type { DateString } from './time.js';
export type { DayPanchang, Kala, LunarMonth } from './panchang.js';
export { PRESETS } from './location.js';
export {
  MONTHS,
  NAKSHATRAS,
  RASHIS,
  TITHIS,
  lunarMonthsAround,
  nakshatraAt,
  sankranti,
  sunRashiAt,
  tithiAt,
  tithiName,
} from './panchang.js';
export {
  lahiriAyanamsa,
  moonSidereal,
  moonrise,
  sunSidereal,
  sunrise,
  sunset,
} from './astro.js';
export { chineseNewYear, easterSunday, iranianNowruz, shahenshahiNavroz } from './festivals/other.js';

/** Every supported festival. */
export const FESTIVALS: readonly Festival[] = [...SOLAR_FESTIVALS, ...HINDU_FESTIVALS, ...OTHER_FESTIVALS];

/** Festivals this library does not calculate, and why. */
export const NOT_SUPPORTED: Readonly<Record<string, string>> = {
  eid: 'Islamic dates depend on local moon sighting; out of scope.',
  'eid-al-adha': 'Islamic dates depend on local moon sighting; out of scope.',
  'islamic-new-year': 'Islamic dates depend on local moon sighting; out of scope.',
  'milad-un-nabi': 'Islamic dates depend on local moon sighting; out of scope.',
  'ramadan-start': 'Islamic dates depend on local moon sighting; out of scope.',
  'shab-e-barat': 'Islamic dates depend on local moon sighting; out of scope.',
  'shab-e-qadr': 'Islamic dates depend on local moon sighting; out of scope.',
  losar:
    'Losar follows the Tibetan (Phugpa) calendar, whose own arithmetic is not implemented here; ' +
    'it is often, but not always, a day after Lunar New Year.',
};

const byId = new Map(FESTIVALS.map((f) => [f.id, f]));

/** A location, or the name of one of the preset cities. */
export type Place = Location | PresetName;

function toLocation(place: Place): Location {
  if (typeof place === 'string') {
    const p = PRESETS[place];
    if (!p) throw new RangeError(`Unknown preset: ${place}`);
    return p;
  }
  return place;
}

/** A festival's definition (name, tradition, rule), or undefined. */
export function getFestival(id: string): Festival | undefined {
  return byId.get(id);
}

/**
 * The observances of a festival whose first day falls in `year`, as local
 * dates at `place`. Usually one; some years have none or two.
 */
export function festivalDays(id: string, year: number, place: Place): FestivalDays[] {
  const f = byId.get(id);
  if (!f) throw new RangeError(`Unknown festival: ${id}`);
  return f.days(year, toLocation(place));
}

export interface FestivalOccurrence extends FestivalDays {
  id: string;
  name: string;
}

/** Every supported festival in `year` at `place`, in date order. */
export function festivalsInYear(year: number, place: Place): FestivalOccurrence[] {
  const loc = toLocation(place);
  const out: FestivalOccurrence[] = [];
  for (const f of FESTIVALS) {
    for (const d of f.days(year, loc)) out.push({ id: f.id, name: f.name, ...d });
  }
  return out.sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : a.id < b.id ? -1 : 1));
}

/** The festivals that include `date` (YYYY-MM-DD) at `place`. */
export function festivalsOn(date: DateString, place: Place): FestivalOccurrence[] {
  const year = Number(date.slice(0, 4));
  const near = [...festivalsInYear(year - 1, place), ...festivalsInYear(year, place)];
  return near.filter((o) => o.first <= date && date <= o.last);
}

/** The panchang of a local day at `place` (tithi, nakshatra and month at sunrise). */
export function panchang(date: DateString, place: Place): DayPanchang {
  return dayPanchang(date, toLocation(place));
}
