// Calendar days and time zones. A festival falls on a local calendar day
// where the observer is, so every rule works in "YYYY-MM-DD" days of an
// IANA time zone. Instants are plain UTC milliseconds.

/** A local calendar day, "YYYY-MM-DD". */
export type DateString = string;

const DAY_MS = 86_400_000;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatter(timeZone: string): Intl.DateTimeFormat {
  let f = formatters.get(timeZone);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    formatters.set(timeZone, f);
  }
  return f;
}

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function wallClock(utcMs: number, timeZone: string): WallClock {
  const parts = formatter(timeZone).formatToParts(new Date(utcMs));
  const get = (type: Intl.DateTimeFormatPartTypes): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number(part.value) : 0;
  };
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/** The zone's offset from UTC at this instant, in milliseconds. */
export function zoneOffsetMs(utcMs: number, timeZone: string): number {
  const w = wallClock(utcMs, timeZone);
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
  // Intl drops milliseconds; compare whole seconds.
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

function pad(n: number, width = 2): string {
  return String(n).padStart(width, '0');
}

/** The local calendar day of an instant. */
export function localDate(utcMs: number, timeZone: string): DateString {
  const w = wallClock(utcMs, timeZone);
  return `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)}`;
}

/** "HH:MM" local time of an instant (for display and debugging). */
export function localTime(utcMs: number, timeZone: string): string {
  const w = wallClock(utcMs, timeZone);
  return `${pad(w.hour)}:${pad(w.minute)}`;
}

export function parseDate(date: DateString): { year: number; month: number; day: number } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) throw new RangeError(`Not a YYYY-MM-DD date: ${date}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function formatDate(year: number, month: number, day: number): DateString {
  const ms = Date.UTC(year, month - 1, day);
  const d = new Date(ms);
  return `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** The day `days` after `date` (negative goes back). */
export function addDays(date: DateString, days: number): DateString {
  const { year, month, day } = parseDate(date);
  return formatDate(year, month, day + days);
}

/** Whole days from `a` to `b`. */
export function daysBetween(a: DateString, b: DateString): number {
  const pa = parseDate(a);
  const pb = parseDate(b);
  return Math.round(
    (Date.UTC(pb.year, pb.month - 1, pb.day) - Date.UTC(pa.year, pa.month - 1, pa.day)) / DAY_MS
  );
}

/** Day of the week, 0 = Sunday. */
export function weekday(date: DateString): number {
  const { year, month, day } = parseDate(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/** The UTC instant of local midnight at the start of `date`. */
export function zonedMidnight(date: DateString, timeZone: string): number {
  const { year, month, day } = parseDate(date);
  const wall = Date.UTC(year, month - 1, day);
  let guess = wall - zoneOffsetMs(wall, timeZone);
  // Two refinements settle offsets that change near the guess (DST).
  for (let i = 0; i < 2; i++) {
    const next = wall - zoneOffsetMs(guess, timeZone);
    if (next === guess) break;
    guess = next;
  }
  return guess;
}

/** The nth (1-based) given weekday of a month; n = -1 is the last one. */
export function nthWeekday(year: number, month: number, dow: number, n: number): DateString {
  if (n > 0) {
    const first = formatDate(year, month, 1);
    const shift = (dow - weekday(first) + 7) % 7;
    return addDays(first, shift + (n - 1) * 7);
  }
  const last = formatDate(year, month + 1, 0);
  const shift = (weekday(last) - dow + 7) % 7;
  return addDays(last, -shift);
}

export { DAY_MS };
