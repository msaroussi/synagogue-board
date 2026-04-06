import { TestBed } from '@angular/core/testing';
import { ConfigService, FONT_SIZE_KEYS } from './config.service';

const STORAGE_KEY = 'synagogue-board-config';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have default geonameid from config', () => {
    expect(service.geonameid()).toBe(281184);
  });

  it('should have default cityName from config', () => {
    expect(service.cityName()).toBe('ירושלים');
  });

  it('should have configMode off by default', () => {
    expect(service.configMode()).toBe(false);
  });

  it('should have splitView off by default', () => {
    expect(service.splitView()).toBe(false);
  });

  it('should have splitPosition at 50 by default', () => {
    expect(service.splitPosition()).toBe(50);
  });

  it('should have all font size percents at 100 by default', () => {
    const percents = service.fontSizePercents();
    for (const key of FONT_SIZE_KEYS) {
      expect(percents[key]).toBe(100);
    }
  });

  describe('updateGeonameid', () => {
    it('should update geonameid signal', () => {
      service.updateGeonameid(12345);
      expect(service.geonameid()).toBe(12345);
    });

    it('should persist to localStorage', () => {
      service.updateGeonameid(12345);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.geonameid).toBe(12345);
    });

    it('should emit on reload$', (done) => {
      service.reload$.subscribe(() => {
        done();
      });
      service.updateGeonameid(99999);
    });
  });

  describe('updateCityName', () => {
    it('should update cityName signal', () => {
      service.updateCityName('תל אביב');
      expect(service.cityName()).toBe('תל אביב');
    });

    it('should persist to localStorage', () => {
      service.updateCityName('תל אביב');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.cityName).toBe('תל אביב');
    });
  });

  describe('updateDedication', () => {
    it('should update dedication signal', () => {
      service.updateDedication('test dedication');
      expect(service.dedication()).toBe('test dedication');
    });

    it('should persist to localStorage', () => {
      service.updateDedication('test dedication');
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!);
      expect(stored.dedication).toBe('test dedication');
    });
  });

  describe('updateBoardWidth / updateBoardHeight', () => {
    it('should update boardWidth', () => {
      service.updateBoardWidth('80vw');
      expect(service.boardWidth()).toBe('80vw');
    });

    it('should update boardHeight', () => {
      service.updateBoardHeight('30vw');
      expect(service.boardHeight()).toBe('30vw');
    });
  });

  describe('adjustBoardSize', () => {
    it('should increase width', () => {
      service.updateBoardWidth('96vw');
      service.adjustBoardSize('width', 2);
      expect(service.boardWidth()).toBe('98vw');
    });

    it('should decrease height', () => {
      service.updateBoardHeight('24vw');
      service.adjustBoardSize('height', -4);
      expect(service.boardHeight()).toBe('20vw');
    });

    it('should not go below 1', () => {
      service.updateBoardWidth('2vw');
      service.adjustBoardSize('width', -5);
      expect(service.boardWidth()).toBe('1vw');
    });

    it('should do nothing for non-parseable values', () => {
      service.updateBoardWidth('auto');
      service.adjustBoardSize('width', 5);
      expect(service.boardWidth()).toBe('auto');
    });
  });

  describe('toggleBlinkColon', () => {
    it('should toggle from false to true', () => {
      expect(service.blinkColon()).toBe(false);
      service.toggleBlinkColon();
      expect(service.blinkColon()).toBe(true);
    });

    it('should toggle back to false', () => {
      service.toggleBlinkColon();
      service.toggleBlinkColon();
      expect(service.blinkColon()).toBe(false);
    });
  });

  describe('toggleSplitView', () => {
    it('should toggle split view', () => {
      expect(service.splitView()).toBe(false);
      service.toggleSplitView();
      expect(service.splitView()).toBe(true);
    });
  });

  describe('updateSplitPosition', () => {
    it('should update split position', () => {
      service.updateSplitPosition(70);
      expect(service.splitPosition()).toBe(70);
    });

    it('should clamp to minimum 10', () => {
      service.updateSplitPosition(5);
      expect(service.splitPosition()).toBe(10);
    });

    it('should clamp to maximum 90', () => {
      service.updateSplitPosition(95);
      expect(service.splitPosition()).toBe(90);
    });
  });

  describe('toggleConfigMode', () => {
    it('should toggle config mode', () => {
      expect(service.configMode()).toBe(false);
      service.toggleConfigMode();
      expect(service.configMode()).toBe(true);
      service.toggleConfigMode();
      expect(service.configMode()).toBe(false);
    });
  });

  describe('adjustFontSize', () => {
    it('should increase font size percent', () => {
      service.adjustFontSize('clockHour', 10);
      expect(service.fontSizePercents()['clockHour']).toBe(110);
    });

    it('should clamp to minimum 20', () => {
      service.adjustFontSize('clockHour', -200);
      expect(service.fontSizePercents()['clockHour']).toBe(20);
    });

    it('should clamp to maximum 300', () => {
      service.adjustFontSize('clockHour', 500);
      expect(service.fontSizePercents()['clockHour']).toBe(300);
    });
  });

  describe('computed font sizes', () => {
    it('should return base value when percent is 100', () => {
      const size = service.zmanimBarTitleFontSize();
      expect(size).toBe('clamp(0.55rem, 0.95vw, 0.85rem)');
    });

    it('should return calc expression when percent is not 100', () => {
      service.adjustFontSize('zmanimBarTitle', 50);
      const size = service.zmanimBarTitleFontSize();
      expect(size).toContain('calc(');
      expect(size).toContain('1.5');
    });
  });

  describe('resetToDefaults', () => {
    it('should reset all values to defaults', () => {
      service.updateGeonameid(99999);
      service.updateCityName('changed');
      service.adjustFontSize('clockHour', 50);
      service.toggleSplitView();

      service.resetToDefaults();

      expect(service.geonameid()).toBe(281184);
      expect(service.cityName()).toBe('ירושלים');
      expect(service.fontSizePercents()['clockHour']).toBe(100);
      expect(service.splitView()).toBe(false);
      expect(service.splitPosition()).toBe(50);
    });

    it('should emit on reload$', (done) => {
      service.reload$.subscribe(() => done());
      service.resetToDefaults();
    });
  });

  describe('localStorage persistence', () => {
    it('should save to localStorage on construction', () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const stored = JSON.parse(raw!);
      expect(stored.geonameid).toBe(281184);
    });

    it('should restore from localStorage on fresh inject', () => {
      const config = {
        geonameid: 55555,
        cityName: 'חיפה',
        dedication: 'test',
        blinkColon: true,
        boardWidth: '80vw',
        boardHeight: '20vw',
        fontSizePercents: { clockHour: 150 },
        splitView: true,
        splitPosition: 60,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const fresh = TestBed.inject(ConfigService);

      expect(fresh.geonameid()).toBe(55555);
      expect(fresh.cityName()).toBe('חיפה');
      expect(fresh.blinkColon()).toBe(true);
      expect(fresh.splitView()).toBe(true);
      expect(fresh.splitPosition()).toBe(60);
      expect(fresh.fontSizePercents()['clockHour']).toBe(150);
    });

    it('should handle corrupt localStorage gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'not-valid-json');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});
      const fresh = TestBed.inject(ConfigService);

      expect(fresh.geonameid()).toBe(281184);
    });
  });
});
