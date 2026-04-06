import { ComponentFixture, TestBed, fakeAsync, tick, discardPeriodicTasks } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { App } from './app';
import { ConfigService } from './services/config.service';

describe('App', () => {
  let component: App;
  let fixture: ComponentFixture<App>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App, HttpClientTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    try { httpMock.match(() => true); } catch { /* ignore */ }
  });

  function flushAllPending(): void {
    httpMock.match(() => true).forEach((req) => {
      if (req.cancelled) return;
      if (req.request.url.includes('converter')) {
        req.flush({ hebrew: 'ז׳ ניסן תשפ״ו' });
      } else if (req.request.url.includes('/zmanim')) {
        req.flush({ times: { sunrise: '2026-04-06T06:15:00+03:00' } });
      } else if (req.request.url.includes('hebcal')) {
        req.flush({
          items: [
            { category: 'parashat', hebrew: 'צו' },
            { category: 'candles', date: '2026-04-10T18:30:00+03:00' },
            { category: 'havdalah', date: '2026-04-11T19:35:00+03:00' },
          ],
        });
      } else if (req.request.url.includes('sefaria')) {
        req.flush({
          calendar_items: [
            { title: { en: 'Daf Yomi' }, displayValue: { he: 'פסחים דף ק״כ' } },
          ],
        });
      }
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set gregorian date on init', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();
    expect(component.gregorianDate()).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
    discardPeriodicTasks();
  }));

  it('should load hebrew date', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();
    expect(component.hebrewDate()).toBe('ז׳ ניסן תשפ״ו');
    discardPeriodicTasks();
  }));

  it('should load parasha name', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();
    expect(component.parashaName()).toBe('צו');
    discardPeriodicTasks();
  }));

  it('should load daf yomi', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();
    expect(component.dafYomi()).toBe('פסחים דף ק״כ');
    discardPeriodicTasks();
  }));

  it('should set dataLoaded after parasha fetch', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();
    expect(component.dataLoaded()).toBe(true);
    discardPeriodicTasks();
  }));

  it('should handle hebrew date error', fakeAsync(() => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((req) => {
      if (req.request.url.includes('converter')) {
        req.flush('Error', { status: 500, statusText: 'Error' });
      } else if (req.request.url.includes('/zmanim')) {
        req.flush({ times: {} });
      } else if (req.request.url.includes('hebcal')) {
        req.flush({ items: [] });
      } else if (req.request.url.includes('sefaria')) {
        req.flush({ calendar_items: [] });
      }
    });
    tick();
    expect(component.hebrewDate()).toBe('---');
    discardPeriodicTasks();
  }));

  it('should handle zmanim error', fakeAsync(() => {
    fixture.detectChanges();
    httpMock.match(() => true).forEach((req) => {
      if (req.request.url.includes('/zmanim')) {
        req.flush('Error', { status: 500, statusText: 'Error' });
      } else if (req.request.url.includes('converter')) {
        req.flush({ hebrew: 'test' });
      } else if (req.request.url.includes('hebcal')) {
        req.flush({ items: [] });
      } else if (req.request.url.includes('sefaria')) {
        req.flush({ calendar_items: [] });
      }
    });
    tick();
    expect(component.zmanimError()).toBe(true);
    expect(component.zmanimLoading()).toBe(false);
    discardPeriodicTasks();
  }));

  it('should reload when config emits reload$', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();

    const configService = TestBed.inject(ConfigService);
    configService.updateGeonameid(99999);
    flushAllPending();
    tick();

    discardPeriodicTasks();
  }));

  it('should not start separator drag when not in config mode', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();

    component.onSeparatorMouseDown(new MouseEvent('mousedown'));
    expect(component['separatorDragging']).toBe(false);
    discardPeriodicTasks();
  }));

  it('should handle separator drag in config mode', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();

    const configService = TestBed.inject(ConfigService);
    configService.toggleConfigMode();

    component.onSeparatorMouseDown(new MouseEvent('mousedown'));
    expect(component['separatorDragging']).toBe(true);

    component.onDocMouseUp();
    expect(component['separatorDragging']).toBe(false);
    discardPeriodicTasks();
  }));

  it('should clean up interval on destroy', fakeAsync(() => {
    fixture.detectChanges();
    flushAllPending();
    tick();

    component.ngOnDestroy();
    discardPeriodicTasks();
  }));
});
