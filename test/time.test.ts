import { describe, expect, it } from 'vitest';

import {
  addDays,
  daysBetween,
  localDate,
  localTime,
  nthWeekday,
  weekday,
  zonedMidnight,
} from '../src/time.js';

describe('calendar days', () => {
  it('adds days across months and leap years', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
  });

  it('knows the weekday', () => {
    expect(weekday('2026-11-02')).toBe(1); // a Monday
    expect(weekday('2000-01-01')).toBe(6); // a Saturday
  });

  it('finds the nth and last weekday of a month', () => {
    expect(nthWeekday(2026, 5, 0, 2)).toBe('2026-05-10');
    expect(nthWeekday(2026, 11, 4, 4)).toBe('2026-11-26');
    expect(nthWeekday(2026, 5, 1, -1)).toBe('2026-05-25');
  });
});

describe('time zones', () => {
  it('finds local midnight, including on DST change days', () => {
    expect(zonedMidnight('2026-11-02', 'Asia/Kolkata')).toBe(Date.UTC(2026, 10, 1, 18, 30));
    expect(zonedMidnight('2026-03-29', 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 0, 0));
    expect(zonedMidnight('2026-03-30', 'Europe/London')).toBe(Date.UTC(2026, 2, 29, 23, 0));
    expect(zonedMidnight('2026-11-01', 'America/Toronto')).toBe(Date.UTC(2026, 10, 1, 4, 0));
  });

  it('reads the local date and time of an instant', () => {
    const t = Date.UTC(2026, 0, 14, 20, 0);
    expect(localDate(t, 'Asia/Kolkata')).toBe('2026-01-15');
    expect(localTime(t, 'Asia/Kolkata')).toBe('01:30');
    expect(localDate(t, 'America/Vancouver')).toBe('2026-01-14');
  });
});
