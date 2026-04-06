import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HebcalService, ZmanItem, ParashaResult } from './hebcal.service';

describe('HebcalService', () => {
  let service: HebcalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
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

  describe('fetchHebrewDate', () => {
    it('should fetch hebrew date from hebcal converter', () => {
      const mockResponse = { hebrew: 'ז׳ ניסן תשפ״ו' };

      service.fetchHebrewDate().subscribe((data) => {
        expect(data.hebrew).toBe('ז׳ ניסן תשפ״ו');
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/converter'));
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toContain('g2h=1');
      req.flush(mockResponse);
    });
  });

  describe('fetchZmanim', () => {
    it('should return formatted zmanim items', () => {
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

      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => {
        result = items;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      expect(req.request.url).toContain('geonameid=281184');
      req.flush(mockTimes);

      expect(result.length).toBe(11);
      expect(result[0].label).toBe('עלות השחר');
      expect(result[1].label).toBe('הנץ החמה');
    });

    it('should filter out missing times', () => {
      const mockTimes = {
        times: {
          sunrise: '2026-04-06T06:15:00+03:00',
          sunset: '2026-04-06T19:00:00+03:00',
        },
      };

      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => {
        result = items;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush(mockTimes);

      expect(result.length).toBe(2);
    });

    it('should handle empty times', () => {
      let result: ZmanItem[] = [];
      service.fetchZmanim(281184).subscribe((items) => {
        result = items;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush({});

      expect(result.length).toBe(0);
    });

    it('should propagate HTTP errors', () => {
      let errorThrown = false;
      service.fetchZmanim(281184).subscribe({
        error: () => { errorThrown = true; },
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/zmanim'));
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorThrown).toBe(true);
    });
  });

  describe('fetchParashaAndShabbat', () => {
    it('should parse parasha, candle lighting, havdalah, and omer', () => {
      const todayStr = new Date().toISOString().slice(0, 10);
      const mockResponse = {
        items: [
          { category: 'parashat', hebrew: 'צו', title: 'Tzav' },
          { category: 'candles', date: '2026-04-10T18:30:00+03:00' },
          { category: 'havdalah', date: '2026-04-11T19:35:00+03:00' },
          {
            category: 'omer',
            date: todayStr,
            hebrew: 'היום שבעה ימים',
            title: '7th day of the Omer',
          },
        ],
      };

      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => {
        result = r;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush(mockResponse);

      expect(result!.parashaName).toBe('צו');
      expect(result!.showOmer).toBe(true);
      expect(result!.omerCount).toBe('היום שבעה ימים');
      expect(result!.candleLighting).toBeTruthy();
      expect(result!.havdalah).toBeTruthy();
    });

    it('should fall back to holiday when no parasha', () => {
      const mockResponse = {
        items: [
          { category: 'holiday', subcat: 'major', hebrew: 'פסח', title: 'Pesach' },
        ],
      };

      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => {
        result = r;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush(mockResponse);

      expect(result!.parashaName).toBe('פסח');
    });

    it('should return defaults when no items', () => {
      let result: ParashaResult | null = null;
      service.fetchParashaAndShabbat(281184).subscribe((r) => {
        result = r;
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush({ items: [] });

      expect(result!.parashaName).toBe('---');
      expect(result!.showOmer).toBe(false);
      expect(result!.candleLighting).toBe('');
      expect(result!.havdalah).toBe('');
    });

    it('should propagate HTTP errors', () => {
      let errorThrown = false;
      service.fetchParashaAndShabbat(281184).subscribe({
        error: () => { errorThrown = true; },
      });

      const req = httpMock.expectOne((r) => r.url.includes('hebcal.com/hebcal'));
      req.flush('Error', { status: 500, statusText: 'Error' });

      expect(errorThrown).toBe(true);
    });
  });

  describe('fetchDafYomi', () => {
    it('should return hebrew daf yomi name', () => {
      const mockResponse = {
        calendar_items: [
          { title: { en: 'Daf Yomi' }, displayValue: { he: 'פסחים דף ק״כ', en: 'Pesachim 120' } },
          { title: { en: 'Other' }, displayValue: { he: 'other' } },
        ],
      };

      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush(mockResponse);

      expect(result).toBe('פסחים דף ק״כ');
    });

    it('should fallback to english when no hebrew', () => {
      const mockResponse = {
        calendar_items: [
          { title: { en: 'Daf Yomi' }, displayValue: { en: 'Pesachim 120' } },
        ],
      };

      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush(mockResponse);

      expect(result).toBe('Pesachim 120');
    });

    it('should return --- when no daf yomi found', () => {
      let result = '';
      service.fetchDafYomi().subscribe((name) => { result = name; });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush({ calendar_items: [] });

      expect(result).toBe('---');
    });

    it('should propagate HTTP errors', () => {
      let errorThrown = false;
      service.fetchDafYomi().subscribe({
        error: () => { errorThrown = true; },
      });

      const req = httpMock.expectOne((r) => r.url.includes('sefaria.org/api/calendars'));
      req.flush('Error', { status: 500, statusText: 'Error' });

      expect(errorThrown).toBe(true);
    });
  });

  describe('getSeasonPrayer', () => {
    const RealDate = Date;

    afterEach(() => {
      global.Date = RealDate;
    });

    it('should return summer prayer in April-October', () => {
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

    it('should return winter prayer in November-March', () => {
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
