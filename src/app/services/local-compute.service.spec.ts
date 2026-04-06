import { TestBed } from '@angular/core/testing';
import { LocalComputeService, LocalDayData } from './local-compute.service';

describe('LocalComputeService', () => {
  let service: LocalComputeService;

  // 2026-01-02 is a Friday; Jerusalem coordinates
  const testDate = new Date(2026, 0, 2); // local date, no UTC offset issues
  const lat = 31.7683;
  const lon = 35.2137;
  const tzid = 'Asia/Jerusalem';

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalComputeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('computeDay()', () => {
    let result: LocalDayData;

    beforeEach(() => {
      result = service.computeDay(testDate, lat, lon, tzid);
    });

    it('returns a LocalDayData object with all required fields', () => {
      expect(result).toHaveProperty('hebrewDate');
      expect(result).toHaveProperty('zmanim');
      expect(result).toHaveProperty('parasha');
      expect(result).toHaveProperty('omer');
      expect(result).toHaveProperty('candleLighting');
      expect(result).toHaveProperty('havdalah');
      expect(result).toHaveProperty('dafYomi');
    });

    it('hebrewDate is a non-empty Hebrew string', () => {
      expect(typeof result.hebrewDate).toBe('string');
      expect(result.hebrewDate.length).toBeGreaterThan(0);
      // Hebrew characters are in the range \u05D0-\u05EA (and geresh/gershayim \u05F3\u05F4)
      expect(result.hebrewDate).toMatch(/[\u05D0-\u05EA]/);
    });

    it('zmanim contains sunrise and sunset keys', () => {
      expect(result.zmanim).toHaveProperty('sunrise');
      expect(result.zmanim).toHaveProperty('sunset');
    });

    it('zmanim values are in HH:MM format', () => {
      const timePattern = /^\d{2}:\d{2}$/;
      for (const [key, val] of Object.entries(result.zmanim)) {
        expect(val).toMatch(timePattern);
      }
    });

    it('dafYomi returns a non-empty Hebrew string', () => {
      expect(typeof result.dafYomi).toBe('string');
      expect(result.dafYomi.length).toBeGreaterThan(0);
      // Hebrew characters present
      expect(result.dafYomi).toMatch(/[\u05D0-\u05EA]/);
    });

    it('dafYomi for 2026-01-02 is זבחים דף ק״י', () => {
      expect(result.dafYomi).toBe('זבחים דף ק״י');
    });

    it('on a Friday, candleLighting is non-null', () => {
      // 2026-01-02 is a Friday
      expect(testDate.getDay()).toBe(5);
      expect(result.candleLighting).not.toBeNull();
    });

    it('parasha is found for the week containing Shabbat', () => {
      // computeDay scans 7 days ahead so the Shabbat parasha should be found
      expect(result.parasha).not.toBeNull();
      expect(typeof result.parasha).toBe('string');
      expect((result.parasha as string).length).toBeGreaterThan(0);
    });

    it('candleLighting is in HH:MM format', () => {
      expect(result.candleLighting).toMatch(/^\d{2}:\d{2}$/);
    });
  });
});
