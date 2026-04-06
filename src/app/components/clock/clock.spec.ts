import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Clock } from './clock';

describe('Clock', () => {
  let component: Clock;
  let fixture: ComponentFixture<Clock>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Clock],
    }).compileComponents();

    fixture = TestBed.createComponent(Clock);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize clock values on init', () => {
    fixture.detectChanges();
    expect(component.clockHr()).toMatch(/^\d{2}$/);
    expect(component.clockMin()).toMatch(/^\d{2}$/);
    expect(component.clockSec()).toMatch(/^\d{2}$/);
  });

  it('should set Hebrew day name on init', () => {
    fixture.detectChanges();
    const hebrewDays = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש'];
    expect(hebrewDays).toContain(component.dayName());
  });

  it('should display formatted time with zero-padded values', () => {
    fixture.detectChanges();
    expect(component.clockHr().length).toBe(2);
    expect(component.clockMin().length).toBe(2);
    expect(component.clockSec().length).toBe(2);
  });

  it('should expose blinkColon from config', () => {
    fixture.detectChanges();
    expect(typeof component.blinkColon()).toBe('boolean');
  });

  it('should clean up interval on destroy', () => {
    fixture.detectChanges();
    const spy = jest.spyOn(globalThis, 'clearInterval');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should not throw if destroyed before init', () => {
    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
