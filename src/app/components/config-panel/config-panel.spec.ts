import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfigPanel } from './config-panel';
import { ConfigService } from '../../services/config.service';

describe('ConfigPanel', () => {
  let component: ConfigPanel;
  let fixture: ComponentFixture<ConfigPanel>;
  let configService: ConfigService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ConfigPanel],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigPanel);
    component = fixture.componentInstance;
    configService = TestBed.inject(ConfigService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle config mode on Alt+C', () => {
    expect(configService.configMode()).toBe(false);
    component.onKeyDown(new KeyboardEvent('keydown', { altKey: true, code: 'KeyC' }));
    expect(configService.configMode()).toBe(true);
  });

  it('should close panel when config mode is toggled off', () => {
    component.onKeyDown(new KeyboardEvent('keydown', { altKey: true, code: 'KeyC' }));
    component.panelOpen = true;
    component.onKeyDown(new KeyboardEvent('keydown', { altKey: true, code: 'KeyC' }));
    expect(component.panelOpen).toBe(false);
  });

  it('should not toggle on other key combos', () => {
    component.onKeyDown(new KeyboardEvent('keydown', { altKey: false, code: 'KeyC' }));
    expect(configService.configMode()).toBe(false);

    component.onKeyDown(new KeyboardEvent('keydown', { altKey: true, code: 'KeyA' }));
    expect(configService.configMode()).toBe(false);
  });

  it('should have font size items defined', () => {
    expect(component.fontSizeItems.length).toBe(13);
    expect(component.fontSizeItems[0].key).toBe('zmanimBarTitle');
  });

  describe('onGeoChange', () => {
    it('should update geonameid for valid number', () => {
      component.onGeoChange('12345');
      expect(configService.geonameid()).toBe(12345);
    });

    it('should not update for invalid input', () => {
      const original = configService.geonameid();
      component.onGeoChange('abc');
      expect(configService.geonameid()).toBe(original);
    });

    it('should not update for zero or negative', () => {
      const original = configService.geonameid();
      component.onGeoChange('0');
      expect(configService.geonameid()).toBe(original);
      component.onGeoChange('-5');
      expect(configService.geonameid()).toBe(original);
    });
  });

  describe('drag behavior', () => {
    it('should track drag state on header mouse down', () => {
      const event = new MouseEvent('mousedown', { clientX: 100, clientY: 200 });
      component.onHeaderMouseDown(event);
      expect(component['dragging']).toBe(true);
    });

    it('should update position on mouse move when dragging', () => {
      component.onHeaderMouseDown(new MouseEvent('mousedown', { clientX: 10, clientY: 50 }));
      component.onMouseMove(new MouseEvent('mousemove', { clientX: 110, clientY: 150 }));
      expect(component.panelX).toBe(110 - (10 - 10));
      expect(component.panelY).toBe(150 - (50 - 50));
    });

    it('should stop dragging on mouse up', () => {
      component.onHeaderMouseDown(new MouseEvent('mousedown', { clientX: 0, clientY: 0 }));
      component.onMouseUp();
      expect(component['dragging']).toBe(false);
    });

    it('should not move when not dragging', () => {
      const origX = component.panelX;
      const origY = component.panelY;
      component.onMouseMove(new MouseEvent('mousemove', { clientX: 200, clientY: 300 }));
      expect(component.panelX).toBe(origX);
      expect(component.panelY).toBe(origY);
    });
  });
});
