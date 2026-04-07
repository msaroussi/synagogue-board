import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CacheService, DayCache } from './cache.service';

const mockDay: DayCache = {
  hebrewDate: 'ז׳ ניסן תשפ״ו',
  zmanim: { sunrise: '06:00', sunset: '19:00' },
  parasha: 'Metzora',
  omer: '7',
  candleLighting: '19:05',
  havdalah: '20:10',
  dafYomi: 'Kiddushin 2',
};

const mockYearCache = {
  geonameid: 293397,
  year: 2026,
  days: {
    '2026-04-07': mockDay,
  },
};

describe('CacheService', () => {
  let service: CacheService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(CacheService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('returns day data from HTTP-loaded JSON file', (done) => {
    service.getDayData('2026-04-07').subscribe((data) => {
      expect(data).toEqual(mockDay);
      done();
    });

    const req = httpMock.expectOne('assets/cache/2026.json');
    expect(req.request.method).toBe('GET');
    req.flush(mockYearCache);
  });

  it('returns null when date not found in cache', (done) => {
    service.getDayData('2026-12-31').subscribe((data) => {
      expect(data).toBeNull();
      done();
    });

    const req = httpMock.expectOne('assets/cache/2026.json');
    req.flush(mockYearCache);
  });

  it('returns null when HTTP request fails', (done) => {
    service.getDayData('2099-01-01').subscribe((data) => {
      expect(data).toBeNull();
      done();
    });

    const req = httpMock.expectOne('assets/cache/2099.json');
    req.flush('Not Found', { status: 404, statusText: 'Not Found' });
  });

  it('uses in-memory cache on second call (no second HTTP request)', (done) => {
    // First call — triggers HTTP
    service.getDayData('2026-04-07').subscribe(() => {
      // Second call — should use in-memory cache, no HTTP request
      service.getDayData('2026-04-07').subscribe((data) => {
        expect(data).toEqual(mockDay);
        httpMock.expectNone('assets/cache/2026.json');
        done();
      });
    });

    const req = httpMock.expectOne('assets/cache/2026.json');
    req.flush(mockYearCache);
  });

  it('correctly parses the year from the date string', (done) => {
    service.getDayData('2025-06-15').subscribe(() => {
      done();
    });

    const req = httpMock.expectOne('assets/cache/2025.json');
    expect(req.request.url).toContain('2025');
    req.flush({ geonameid: 293397, year: 2025, days: {} });
  });
});
