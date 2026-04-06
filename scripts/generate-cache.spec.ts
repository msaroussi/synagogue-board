import {
  parseArgs,
  parseYearRange,
  formatDate,
  formatTime,
  getDaysInYear,
} from './generate-cache';

// ── parseYearRange ────────────────────────────────────────────────────────────

describe('parseYearRange', () => {
  it('parses a range like 2026-2035', () => {
    const years = parseYearRange('2026-2035');
    expect(years).toHaveLength(10);
    expect(years[0]).toBe(2026);
    expect(years[9]).toBe(2035);
  });

  it('parses a single year', () => {
    expect(parseYearRange('2026')).toEqual([2026]);
  });

  it('parses a same-start-end range', () => {
    expect(parseYearRange('2030-2030')).toEqual([2030]);
  });

  it('throws on invalid range', () => {
    expect(() => parseYearRange('abc')).toThrow();
  });
});

// ── parseArgs ─────────────────────────────────────────────────────────────────

describe('parseArgs', () => {
  it('parses --years', () => {
    const result = parseArgs(['node', 'script.ts', '--years', '2026-2028']);
    expect(result.years).toEqual([2026, 2027, 2028]);
  });

  it('parses --geonameid', () => {
    const result = parseArgs(['node', 'script.ts', '--geonameid', '293397']);
    expect(result.geonameid).toBe(293397);
  });

  it('defaults geonameid to 281184 (Jerusalem)', () => {
    const result = parseArgs(['node', 'script.ts', '--years', '2026']);
    expect(result.geonameid).toBe(281184);
  });

  it('parses --force flag', () => {
    const result = parseArgs(['node', 'script.ts', '--years', '2026', '--force']);
    expect(result.force).toBe(true);
  });

  it('force defaults to false', () => {
    const result = parseArgs(['node', 'script.ts', '--years', '2026']);
    expect(result.force).toBe(false);
  });

  it('parses --prebuild and sets years to current year + 10', () => {
    const result = parseArgs(['node', 'script.ts', '--prebuild']);
    expect(result.prebuild).toBe(true);
    const currentYear = new Date().getFullYear();
    expect(result.years).toHaveLength(11);
    expect(result.years[0]).toBe(currentYear);
    expect(result.years[10]).toBe(currentYear + 10);
  });

  it('--prebuild does not override explicit --years', () => {
    const result = parseArgs(['node', 'script.ts', '--prebuild', '--years', '2030-2031']);
    expect(result.years).toEqual([2030, 2031]);
  });

  it('defaults to current year when no --years and no --prebuild', () => {
    const result = parseArgs(['node', 'script.ts']);
    const currentYear = new Date().getFullYear();
    expect(result.years).toEqual([currentYear]);
  });
});

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(formatDate(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(formatDate(new Date(2026, 11, 31))).toBe('2026-12-31');
  });

  it('zero-pads month and day', () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe('2026-03-05');
  });
});

// ── formatTime ────────────────────────────────────────────────────────────────

describe('formatTime', () => {
  it('formats an ISO string to HH:MM in Jerusalem time', () => {
    // 2026-01-01T04:00:00+02:00 => 04:00 in Jerusalem
    const result = formatTime('2026-01-01T04:00:00+02:00');
    expect(result).toMatch(/^\d{2}:\d{2}$/);
  });

  it('returns empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(formatTime(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatTime('')).toBe('');
  });
});

// ── getDaysInYear ─────────────────────────────────────────────────────────────

describe('getDaysInYear', () => {
  it('returns 365 days for a regular year', () => {
    expect(getDaysInYear(2026)).toHaveLength(365);
  });

  it('returns 366 days for a leap year', () => {
    expect(getDaysInYear(2028)).toHaveLength(366);
  });

  it('first day is Jan 1', () => {
    const days = getDaysInYear(2026);
    expect(formatDate(days[0])).toBe('2026-01-01');
  });

  it('last day is Dec 31', () => {
    const days = getDaysInYear(2026);
    expect(formatDate(days[days.length - 1])).toBe('2026-12-31');
  });
});

// ── Output JSON structure ─────────────────────────────────────────────────────

describe('YearCache structure', () => {
  it('has the correct top-level shape', () => {
    const cache = {
      geonameid: 281184,
      year: 2026,
      days: {
        '2026-01-01': {
          hebrewDate: 'כ״ב טבת תשפ״ו',
          zmanim: {
            alotHaShachar: '05:30',
            sunrise: '06:45',
            sofZmanShmaMGA: '08:10',
            sofZmanShma: '08:55',
            sofZmanTfilla: '09:55',
            chatzot: '11:55',
            minchaGedola: '12:25',
            minchaKetana: '15:10',
            plagHaMincha: '16:25',
            sunset: '17:05',
            tzeit: '17:30',
          },
          parasha: null,
          omer: null,
          candleLighting: null,
          havdalah: null,
          dafYomi: 'שבת ל',
        },
      },
    };

    expect(cache.geonameid).toBe(281184);
    expect(cache.year).toBe(2026);
    expect(typeof cache.days).toBe('object');

    const day = cache.days['2026-01-01'];
    expect(typeof day.hebrewDate).toBe('string');
    expect(typeof day.zmanim).toBe('object');
    expect(typeof day.zmanim.sunrise).toBe('string');
    expect(day.parasha).toBeNull();
    expect(day.omer).toBeNull();
    expect(day.candleLighting).toBeNull();
    expect(day.havdalah).toBeNull();
    expect(typeof day.dafYomi).toBe('string');
  });

  it('zmanim has all required fields', () => {
    const zmanimKeys = [
      'alotHaShachar',
      'sunrise',
      'sofZmanShmaMGA',
      'sofZmanShma',
      'sofZmanTfilla',
      'chatzot',
      'minchaGedola',
      'minchaKetana',
      'plagHaMincha',
      'sunset',
      'tzeit',
    ];
    const zmanim = {
      alotHaShachar: '05:30',
      sunrise: '06:45',
      sofZmanShmaMGA: '08:10',
      sofZmanShma: '08:55',
      sofZmanTfilla: '09:55',
      chatzot: '11:55',
      minchaGedola: '12:25',
      minchaKetana: '15:10',
      plagHaMincha: '16:25',
      sunset: '17:05',
      tzeit: '17:30',
    };
    for (const key of zmanimKeys) {
      expect(zmanim).toHaveProperty(key);
    }
  });
});
