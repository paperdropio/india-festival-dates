// Festival tests: public-domain facts (the Gregorian computus, the
// Chinese and Iranian new years, civic days) and the festival rules
// checked against the panchang itself (a festival day must satisfy the
// rule that defines it). No festival table from any website is used.

import { describe, expect, it } from 'vitest';

import { moonrise, sunrise } from '../src/astro.js';
import {
  FESTIVALS,
  NOT_SUPPORTED,
  PRESETS,
  chineseNewYear,
  easterSunday,
  festivalDays,
  festivalsInYear,
  festivalsOn,
  getFestival,
  iranianNowruz,
  shahenshahiNavroz,
  type PresetName,
} from '../src/index.js';
import { kalaWindow, nakshatraAt, overlap, sankranti, tithiAt, type Kala } from '../src/panchang.js';
import { addDays, daysBetween, localDate, weekday } from '../src/time.js';

const ALL = Object.keys(PRESETS) as PresetName[];
const one = (id: string, year: number, place: PresetName) => {
  const d = festivalDays(id, year, place);
  expect(d).toHaveLength(1);
  return d[0]!;
};

describe('Christian movable feasts', () => {
  it('computes Western Easter by the Gregorian computus', () => {
    const known: Record<number, string> = {
      1961: '1961-04-02',
      2000: '2000-04-23',
      2008: '2008-03-23',
      2011: '2011-04-24',
      2019: '2019-04-21',
      2024: '2024-03-31',
      2025: '2025-04-20',
      2038: '2038-04-25',
    };
    for (const [y, d] of Object.entries(known)) expect(easterSunday(Number(y))).toBe(d);
  });

  it('puts Good Friday and Palm Sunday before Easter', () => {
    expect(one('good-friday', 2024, 'london').first).toBe('2024-03-29');
    expect(one('palm-sunday', 2024, 'london').first).toBe('2024-03-24');
  });
});

describe('Chinese, Iranian and Parsi new years', () => {
  it('finds Chinese New Year, including the leap-month year 2033', () => {
    const known: Record<number, string> = {
      2019: '2019-02-05',
      2020: '2020-01-25',
      2021: '2021-02-12',
      2022: '2022-02-01',
      2023: '2023-01-22',
      2024: '2024-02-10',
      2025: '2025-01-29',
      2033: '2033-01-31',
    };
    for (const [y, d] of Object.entries(known)) expect(chineseNewYear(Number(y))).toBe(d);
    expect(one('lunar-new-year', 2024, 'singapore')).toEqual({ first: '2024-02-10', last: '2024-02-11' });
  });

  it('applies the Iranian noon rule to the March equinox', () => {
    expect(iranianNowruz(2021)).toBe('2021-03-21');
    expect(iranianNowruz(2024)).toBe('2024-03-20');
    expect(iranianNowruz(2025)).toBe('2025-03-21');
  });

  it('moves Shahenshahi Navroz a day earlier every four years', () => {
    expect(shahenshahiNavroz(2019)).toBe('2019-08-17');
    expect(shahenshahiNavroz(2020)).toBe('2020-08-16');
    expect(shahenshahiNavroz(2023)).toBe('2023-08-16');
    expect(shahenshahiNavroz(2024)).toBe('2024-08-15');
    expect(one('khordad-sal', 2024, 'new-delhi').first).toBe('2024-08-20');
  });
});

describe('civic days by country', () => {
  it("keeps Mother's Day on the second Sunday of May, Mothering Sunday in the UK", () => {
    expect(one('mothers-day', 2026, 'new-delhi').first).toBe('2026-05-10');
    expect(one('mothers-day', 2026, 'london').first).toBe(addDays(easterSunday(2026), -21));
    expect(one('mothers-day', 2026, 'dubai').first).toBe('2026-03-21');
  });

  it("keeps Father's Day in June, September in Australia", () => {
    expect(one('fathers-day', 2026, 'toronto').first).toBe('2026-06-21');
    expect(one('fathers-day', 2026, 'sydney').first).toBe('2026-09-06');
  });

  it('has Thanksgiving and Grandparents Day only where they are kept', () => {
    expect(one('thanksgiving', 2026, 'toronto').first).toBe('2026-10-12');
    expect(festivalDays('thanksgiving', 2026, { latitude: 40.7, longitude: -74, timeZone: 'America/New_York', country: 'US' })[0]?.first).toBe('2026-11-26');
    expect(festivalDays('thanksgiving', 2026, 'new-delhi')).toEqual([]);
    expect(one('grandparents-day', 2026, 'vancouver').first).toBe('2026-09-13');
  });

  it('keeps fixed days fixed', () => {
    expect(one('republic-day', 2030, 'new-delhi').first).toBe('2030-01-26');
    expect(one('gandhi-jayanti', 2030, 'sydney').first).toBe('2030-10-02');
  });
});

describe('the festival list', () => {
  it('has unique ids, a rule for each, and no Islamic or unsupported festival', () => {
    const ids = FESTIVALS.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of FESTIVALS) {
      expect(f.rule.length).toBeGreaterThan(5);
      expect(NOT_SUPPORTED[f.id]).toBeUndefined();
    }
    expect(getFestival('eid')).toBeUndefined();
    expect(() => festivalDays('eid', 2026, 'new-delhi')).toThrow();
  });

  it('gives every festival one observance a year (Guru Gobind Singh Jayanti none or two)', () => {
    for (const place of ['new-delhi', 'vancouver', 'sydney'] as const) {
      for (const year of [2025, 2031]) {
        for (const f of FESTIVALS) {
          const days = f.days(year, PRESETS[place]);
          if (f.id === 'thanksgiving' || f.id === 'grandparents-day') continue;
          if (f.id === 'guru-gobind-singh-jayanti') expect([0, 1, 2]).toContain(days.length);
          else expect(days, `${f.id} ${year} ${place}`).toHaveLength(1);
          for (const d of days) {
            expect(d.first.startsWith(`${year}-`)).toBe(true);
            expect(d.last >= d.first).toBe(true);
          }
        }
      }
    }
  });

  it('finds Guru Gobind Singh Jayanti twice in 2028 and not in 2026', () => {
    expect(festivalDays('guru-gobind-singh-jayanti', 2028, 'new-delhi')).toHaveLength(2);
    expect(festivalDays('guru-gobind-singh-jayanti', 2026, 'new-delhi')).toHaveLength(0);
  });

  it('lists a year in date order and finds what falls on a day', () => {
    const year = festivalsInYear(2026, 'new-delhi');
    for (let i = 1; i < year.length; i++) expect(year[i]!.first >= year[i - 1]!.first).toBe(true);
    const diwali = year.find((o) => o.id === 'diwali')!;
    expect(festivalsOn(diwali.first, 'new-delhi').map((o) => o.id)).toContain('diwali');
  });
});

// --- The lunar rules hold -----------------------------------------------------

/** The tithis that touch a kala on a day at a place. */
function tithisIn(kala: Kala, date: string, place: PresetName): number[] {
  const w = kalaWindow(kala, date, PRESETS[place])!;
  const out = new Set<number>();
  for (let t = w.start; t <= w.end; t += 5 * 60_000) out.add(tithiAt(t));
  out.add(tithiAt(w.end));
  return [...out];
}

describe('festival days satisfy their rules', () => {
  const years = [2025, 2030];

  it('Diwali: its days come in order, Lakshmi Puja on Amavasya in pradosh', () => {
    for (const place of ALL) {
      for (const y of years) {
        const d = one('diwali', y, place);
        const parts = d.parts!.map((p) => p.date);
        expect([...parts].sort()).toEqual(parts);
        expect(daysBetween(d.first, d.last)).toBeGreaterThanOrEqual(3);
        expect(daysBetween(d.first, d.last)).toBeLessThanOrEqual(5);
        expect(tithisIn('pradosh', parts[1]!, place)).toContain(30);
      }
    }
  });

  it('Holi is the day after Holika Dahan, which is on Purnima night', () => {
    for (const place of ALL) {
      for (const y of years) {
        const dahan = one('holika-dahan', y, place).first;
        expect(one('holi', y, place).first).toBe(addDays(dahan, 1));
        const night = [...tithisIn('pradosh', dahan, place), ...tithisIn('nishita', dahan, place)];
        expect(night.some((t) => t === 15 || t === 16)).toBe(true);
      }
    }
  });

  it('Maha Shivratri: Krishna Chaturdashi at nishita', () => {
    for (const place of ALL) {
      for (const y of years) {
        const d = one('maha-shivratri', y, place).first;
        expect(tithisIn('nishita', d, place)).toContain(29);
      }
    }
  });

  it('Karva Chauth: Krishna Chaturthi at moonrise, else at sunrise', () => {
    for (const place of ALL) {
      for (const y of years) {
        const d = one('karva-chauth', y, place).first;
        const rise = moonrise(d, PRESETS[place]);
        const atMoonrise = rise !== null && tithiAt(rise) === 19;
        const atSunrise = tithiAt(sunrise(d, PRESETS[place])) === 19;
        expect(atMoonrise || atSunrise).toBe(true);
      }
    }
  });

  it('Janmashtami: Smarta day has Ashtami at nishita or sunrise; Vaishnava the same day or later', () => {
    for (const place of ALL) {
      for (const y of years) {
        const d = one('janmashtami', y, place);
        const atNight = tithisIn('nishita', d.first, place).includes(23);
        const atDawn = tithiAt(sunrise(d.first, PRESETS[place])) === 23;
        expect(atNight || atDawn).toBe(true);
        expect(d.vaishnava! >= d.first).toBe(true);
        expect(daysBetween(d.first, d.vaishnava!)).toBeLessThanOrEqual(1);
      }
    }
  });

  it('udaya festivals have their tithi at sunrise, or are kshaya that day', () => {
    const cases: [string, number][] = [
      ['gudi-padwa', 1],
      ['gangaur', 3],
      ['hanuman-jayanti', 15],
      ['rath-yatra', 2],
      ['guru-purnima', 15],
      ['nag-panchami', 5],
      ['tulsi-vivah', 12],
    ];
    for (const [id, tithi] of cases) {
      for (const place of ALL) {
        const d = one(id, 2025, place).first;
        const at = tithiAt(sunrise(d, PRESETS[place]));
        const next = tithiAt(sunrise(addDays(d, 1), PRESETS[place]));
        // At sunrise, or skipped (the tithi before it at sunrise, the one after it next sunrise).
        expect(at === tithi || (at === tithi - 1 && next === tithi + 1), `${id} ${place}`).toBe(true);
      }
    }
  });
});

describe('solar festivals', () => {
  it('ties Lohri, Bhogi and Magh Bihu to Makar Sankranti', () => {
    for (const place of ALL) {
      const sankrantiDay = one('makar-sankranti', 2027, place).first;
      expect(one('lohri', 2027, place).first).toBe(addDays(sankrantiDay, -1));
      expect(one('bhogi', 2027, place).first).toBe(addDays(one('pongal', 2027, place).first, -1));
      const civil = localDate(sankranti(9, 2027), PRESETS[place].timeZone);
      expect(one('magh-bihu', 2027, place).first).toBe(addDays(civil, 1));
    }
  });

  it('starts Puthandu, Vishu, Baisakhi and Pohela Boishakh at Mesha sankranti', () => {
    for (const place of ALL) {
      const civil = localDate(sankranti(0, 2026), PRESETS[place].timeZone);
      for (const id of ['puthandu', 'vishu', 'baisakhi', 'pohela-boishakh']) {
        const d = one(id, 2026, place).first;
        expect(daysBetween(civil, d)).toBeGreaterThanOrEqual(0);
        expect(daysBetween(civil, d)).toBeLessThanOrEqual(1);
      }
      expect(one('baisakhi', 2026, place).first).toBe(civil);
    }
  });

  it('puts Onam\'s Thiruvonam in Chingam with Shravana nakshatra', () => {
    for (const place of ALL) {
      const d = one('onam', 2026, place);
      const sixNazhika = sunrise(d.last, PRESETS[place]) + 144 * 60_000;
      expect(nakshatraAt(sixNazhika)).toBe(21);
      expect(daysBetween(d.first, d.last)).toBeGreaterThanOrEqual(8);
      expect(daysBetween(d.first, d.last)).toBeLessThanOrEqual(11);
    }
  });

  it('keeps every weekday-based day on its weekday', () => {
    expect(weekday(one('mothers-day', 2027, 'new-delhi').first)).toBe(0);
    expect(weekday(one('friendship-day', 2027, 'new-delhi').first)).toBe(0);
    expect(weekday(one('thanksgiving', 2027, 'toronto').first)).toBe(1);
  });
});

describe('places', () => {
  it('accepts any location object', () => {
    const kathmandu = { latitude: 27.7172, longitude: 85.324, timeZone: 'Asia/Kathmandu' };
    const d = festivalDays('diwali', 2026, kathmandu);
    expect(d).toHaveLength(1);
    expect(overlap({ start: 0, end: 1 }, { start: 0, end: 1 })).toBe(1);
  });

  it('rejects an unknown preset', () => {
    expect(() => festivalDays('diwali', 2026, 'atlantis' as PresetName)).toThrow();
  });
});
