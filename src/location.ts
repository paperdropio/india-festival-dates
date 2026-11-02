// Where the festival is observed. Tithis are read at local sunrise, sunset
// and other times of day, so the same festival can fall on different
// calendar days in different cities.

export interface Location {
  /** Degrees north (negative south). */
  latitude: number;
  /** Degrees east (negative west). */
  longitude: number;
  /** IANA time zone, e.g. "Asia/Kolkata". Local calendar days are read here. */
  timeZone: string;
  /** Metres above sea level (optional, default 0). */
  elevation?: number;
  /**
   * ISO 3166-1 alpha-2 country code, e.g. "IN", "GB". Only the civic and
   * Western days that differ by country (Mother's Day, Father's Day,
   * Thanksgiving, Grandparents' Day) use it.
   */
  country?: string;
  /** A display name. */
  name?: string;
}

/** The seven reference cities, one per region. */
export const PRESETS = {
  'new-delhi': {
    name: 'New Delhi',
    latitude: 28.6139,
    longitude: 77.209,
    timeZone: 'Asia/Kolkata',
    country: 'IN',
  },
  toronto: {
    name: 'Toronto',
    latitude: 43.6532,
    longitude: -79.3832,
    timeZone: 'America/Toronto',
    country: 'CA',
  },
  vancouver: {
    name: 'Vancouver',
    latitude: 49.2827,
    longitude: -123.1207,
    timeZone: 'America/Vancouver',
    country: 'CA',
  },
  london: {
    name: 'London',
    latitude: 51.5074,
    longitude: -0.1278,
    timeZone: 'Europe/London',
    country: 'GB',
  },
  dubai: {
    name: 'Dubai',
    latitude: 25.2048,
    longitude: 55.2708,
    timeZone: 'Asia/Dubai',
    country: 'AE',
  },
  singapore: {
    name: 'Singapore',
    latitude: 1.3521,
    longitude: 103.8198,
    timeZone: 'Asia/Singapore',
    country: 'SG',
  },
  sydney: {
    name: 'Sydney',
    latitude: -33.8688,
    longitude: 151.2093,
    timeZone: 'Australia/Sydney',
    country: 'AU',
  },
} as const satisfies Record<string, Location>;

export type PresetName = keyof typeof PRESETS;
