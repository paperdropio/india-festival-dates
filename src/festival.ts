// The shape every festival definition shares.

import type { Location } from './location.js';
import type { DateString } from './time.js';

export type Tradition =
  | 'hindu'
  | 'sikh'
  | 'jain'
  | 'buddhist'
  | 'parsi'
  | 'christian'
  | 'chinese'
  | 'civic';

/** One observance of a festival. */
export interface FestivalDays {
  /** Its first day, YYYY-MM-DD, local to the location. */
  first: DateString;
  /** Its last day; the same as `first` for a one-day festival. */
  last: DateString;
  /**
   * The Vaishnava (ISKCON) day, where it can differ from the Smarta day
   * given in `first` (Janmashtami, Rama Navami).
   */
  vaishnava?: DateString;
  /** Named days inside a festival of several days (Diwali's five days). */
  parts?: { name: string; date: DateString }[];
}

export interface Festival {
  id: string;
  name: string;
  tradition: Tradition;
  /** The rule, in plain words. */
  rule: string;
  /**
   * Observances whose first day falls in `year` (local calendar). Usually
   * one; none or two for festivals of a lunar year that drifts across
   * January (Guru Gobind Singh Jayanti), or for country-specific days
   * where the country does not keep them.
   */
  days(year: number, loc: Location): FestivalDays[];
}

export function single(date: DateString): FestivalDays {
  return { first: date, last: date };
}
