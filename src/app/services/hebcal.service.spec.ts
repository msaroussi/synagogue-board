import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { HebcalService, ZmanItem, ParashaResult } from './hebcal.service';
import { CacheService, DayCache } from './cache.service';
import { LocalComputeService, LocalDayData } from './local-compute.service';

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
const TODAY = fmtDate(new Date());

const MOCK_DAY_CACHE: DayCache = {
  hebrewDate: 'י״ז ניסן תשפ״ו',
  zmanim: {
    alotHaShachar: '04:30',
    sunrise: '06:15',
    sofZmanShmaMGA: '08:45',
    sofZmanShma: '09:15',
    sofZmanTfilla: '10:15',
    chatzot: '12:30',
    minchaGedola: '13:00',
    minchaKetana: '16:00',
    plagHaMincha: '17:15',
    sunset: '19:00',
    tzeit: '19:30',
  },
  parasha: 'צו',
  omer: 'היום שבעה ימים',
  candleLighting: '19:00',
  havdalah: '20:05',
  dafYomi: 'פסחים קכ',
};

const MOCK_LOCAL_DATA: LocalDayData = {
  hebrewDate: 'י״ח ניסן תשפ״ו (local)',
  zmanim: {
    alotHaShachar: '04:31',
    sunrise: '06:16',
    sofZmanShmaMGA: '08:46',
    sofZmanShma: '09:16',
    sofZmanTfilla: '10:16',
    chatzot: '12:31',
    minchaGedola: '13:01',
    minchaKetana: '16:01',
    plagHaMincha: '17:16',
    sunset: '19:01',
    tzeit: '19:31',
  },
  parasha: 'שמיני (local)',
  omer: 'היום שמונה ימים (local)',
  candleLighting: '19:01',
  havdalah: '20:06',
  dafYomi: 'פסחים קכא (local)',
};

describe('HebcalService', () => {
  let service: HebcalService;
  let httpMock: HttpTestingController;
  let cacheGetDayData: jest.Mock;
  let localComputeDay: jest.Mock;

  beforeEach(() => {
    cacheGetDayData = jest.fn().mockReturnValue(of(null));
    localComputeDay = jest.fn().mockReturnValue(MOCK_LOCAL_DATA);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: CacheService, useValue: { getDayData: cacheGetDayData } },
        { provide: LocalComputeService, useValue: { computeDay: localComputeDay } },
      ],
    });

    service = TestBed.inject(HebcalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ---------------------------------------------------------------------------
  // fetchHebrewDate
  // ---------------------------------------------------------------------------
  describe('fetchHebrewDate', () => {
    it('returns API data when API succeeds', () => {
      let result: { hebrew?: string } = {};
      service.fetchHebrewDate().subscribe((d) => { result = d; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/converter'));
      req.flush({ hebrew: 'ז׳ ניסן תשפ״ו' });

      expect(result.hebrew).toBe('ז׳ ניסן תשפ״ו');
      expect(cacheGetDayData).not.toHaveBeenCalled();
    });

    it('returns cache data when API fails and cache has data', () => {
      cacheGetDayData.mockReturnValue(of(MOCK_DAY_CACHE));

      let result: { hebrew?: string } = {};
      service.fetchHebrewDate().subscribe((d) => { result = d; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/converter'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result.hebrew).toBe(MOCK_DAY_CACHE.hebrewDate);
      expect(localComputeDay).not.toHaveBeenCalled();
    });

    it('returns local compute data when API and cache both fail', () => {
      cacheGetDayData.mockReturnValue(of(null));

      let result: { hebrew?: string } = {};
      service.fetchHebrewDate().subscribe((d) => { result = d; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/converter'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result.hebrew).toBe(MOCK_LOCAL_DATA.hebrewDate);
      expect(localComputeDay).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchZmanim
  // ---------------------------------------------------------------------------
  describe('fetchZmanim', () => {
    const mockTimes = {
      times: {
        alotHaShachar: '2026-04-06T04:30:00+03:00',
        sunrise: '2026-04-06T06:15:00+03:00',
        sofZmanShmaMGA: '2026-04-06T08:45:00+03:00',
        sofZmanShma: '2026-04-06T09:15:00+03:00',
        sofZmanTfilla: '2026-04-06T10:15:00+03:00',
        chatzot: '2026-04-06T12:30:00+03:00',
        minchaGedola: '2026-04-06T13:00:00+03:00',
        minchaKetana: '2026-04-06T16:00:00+03:00',
        plagHaMincha: '2026-04-06T17:15:00+03:00',
        sunset: '2026-04-06T19:00:00+03:00',
        tzeit: '2026-04-06T19:30:00+03:00',
      },
    };

    it('returns API data when API succeeds', () => {
      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => { result = items; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      expect(req.request.url).toContain('geonameid=281184');
      req.flush(mockTimes);

      expect(result.length).toBe(11);
      expect(result[0].label).toBe('עלות השחר');
      expect(cacheGetDayData).not.toHaveBeenCalled();
    });

    it('filters out missing times from API response', () => {
      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => { result = items; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush({ times: { sunrise: '2026-04-06T06:15:00+03:00', sunset: '2026-04-06T19:00:00+03:00' } });

      expect(result.length).toBe(2);
    });

    it('returns cache data when API fails and cache has data', () => {
      cacheGetDayData.mockReturnValue(of(MOCK_DAY_CACHE));

      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => { result = items; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result.length).toBe(11);
      expect(result[0].label).toBe('עלות השחר');
      expect(result[0].value).toBe('04:30');
      expect(localComputeDay).not.toHaveBeenCalled();
    });

    it('returns local compute data when API and cache both fail', () => {
      cacheGetDayData.mockReturnValue(of(null));

      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => { result = items; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result.length).toBe(11);
      expect(result[0].label).toBe('עלות השחר');
      expect(localComputeDay).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchParashaAndShabbat
  // ---------------------------------------------------------------------------
  describe('fetchParashaAndShabbat', () => {
    const mockResponse = {
      items: [
        { category: 'parashat', hebrew: 'צו', title: 'Tzav' },
        { category: 'candles', date: '2026-04-10T18:30:00+03:00' },
        { category: 'havdalah', date: '2026-04-11T19:35:00+03:00' },
        { category: 'omer', date: TODAY, hebrew: 'היום שבעה ימים', title: '7th day' },
      ],
    };

    it('returns API data when API succeeds', () => {
      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => { result = r; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush(mockResponse);

      expect(result!.parashaName).toBe('צו');
      expect(result!.showOmer).toBe(true);
      expect(result!.omerCount).toBe('היום שבעה ימים');
      expect(result!.candleLighting).toBeTruthy();
      expect(result!.havdalah).toBeTruthy();
      expect(cacheGetDayData).not.toHaveBeenCalled();
    });

    it('falls back to holiday when no parasha in API response', () => {
      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => { result = r; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush({ items: [{ category: 'holiday', subcat: 'major', hebrew: 'פסח', title: 'Pesach' }] });

      expect(result!.parashaName).toBe('פסח');
    });

    it('returns defaults when API returns empty items', () => {
      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => { result = r; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush({ items: [] });

      expect(result!.parashaName).toBe('---');
      expect(result!.showOmer).toBe(false);
      expect(result!.candleLighting).toBe('');
      expect(result!.havdalah).toBe('');
    });

    it('returns cache data when API fails and cache has data', () => {
      cacheGetDayData.mockReturnValue(of(MOCK_DAY_CACHE));

      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => { result = r; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result!.parashaName).toBe('צו');
      expect(result!.showOmer).toBe(true);
      expect(result!.omerCount).toBe('היום שבעה ימים');
      expect(result!.candleLighting).toBe('19:00');
      expect(result!.havdalah).toBe('20:05');
      expect(localComputeDay).not.toHaveBeenCalled();
    });

    it('returns local compute data when API and cache both fail', () => {
      cacheGetDayData.mockReturnValue(of(null));

      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => { result = r; });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result!.parashaName).toBe('שמיני (local)');
      expect(result!.showOmer).toBe(true);
      expect(localComputeDay).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // fetchDafYomi
  // ---------------------------------------------------------------------------
  describe('fetchDafYomi', () => {
    it('returns API data when API succeeds', () => {
      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush({
        calendar_items: [
          { title: { en: 'Daf Yomi' }, displayValue: { he: 'פסחים דף ק״כ', en: 'Pesachim 120' } },
        ],
      });

      expect(result).toBe('פסחים דף ק״כ');
      expect(cacheGetDayData).not.toHaveBeenCalled();
    });

    it('falls back to english when no hebrew in API response', () => {
      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush({ calendar_items: [{ title: { en: 'Daf Yomi' }, displayValue: { en: 'Pesachim 120' } }] });

      expect(result).toBe('Pesachim 120');
    });

    it('returns --- when no daf yomi found in API response', () => {
      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush({ calendar_items: [] });

      expect(result).toBe('---');
    });

    it('returns cache data when API fails and cache has data', () => {
      cacheGetDayData.mockReturnValue(of(MOCK_DAY_CACHE));

      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result).toBe('פסחים קכ');
      expect(localComputeDay).not.toHaveBeenCalled();
    });

    it('returns local compute data when API and cache both fail', () => {
      cacheGetDayData.mockReturnValue(of(null));

      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush('err', { status: 500, statusText: 'Error' });

      expect(result).toBe('פסחים קכא (local)');
      expect(localComputeDay).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // getSeasonPrayer
  // ---------------------------------------------------------------------------
  describe('getSeasonPrayer', () => {
    const RealDate = Date;

    afterEach(() => {
      global.Date = RealDate;
    });

    it('returns summer prayer in April-October', () => {
      const mockDate = new RealDate(2026, 5, 15);
      global.Date = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate.getTime());
          } else {
            super(...(args as [any]));
          }
        }
      } as DateConstructor;

      const result = service.getSeasonPrayer();
      expect(result.wind).toBe('מוריד הטל');
      expect(result.rain).toBe('ותן ברכה');
    });

    it('returns winter prayer in November-March', () => {
      const mockDate = new RealDate(2026, 0, 15);
      global.Date = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super(mockDate.getTime());
          } else {
            super(...(args as [any]));
          }
        }
      } as DateConstructor;

      const result = service.getSeasonPrayer();
      expect(result.wind).toBe('משיב הרוח ומוריד הגשם');
      expect(result.rain).toBe('ברך עלינו');
    });
  });
});
