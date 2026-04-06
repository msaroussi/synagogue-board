import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ShabbatInfo } from './shabbat-info';

@Component({
  template: `
    <app-shabbat-info
      [dataLoaded]="dataLoaded()"
      [candleLighting]="candleLighting()"
      [havdalahTime]="havdalahTime()"
      [seasonRain]="seasonRain()"
    />
  `,
  imports: [ShabbatInfo],
})
class TestHost {
  dataLoaded = signal(true);
  candleLighting = signal('18:30');
  havdalahTime = signal('19:35');
  seasonRain = signal('ותן ברכה');
}

describe('ShabbatInfo', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.debugElement.query(
      (el) => el.name === 'app-shabbat-info'
    )).toBeTruthy();
  });

  it('should display candle lighting time', () => {
    expect(fixture.nativeElement.textContent).toContain('18:30');
  });

  it('should display havdalah time', () => {
    expect(fixture.nativeElement.textContent).toContain('19:35');
  });

  it('should display season rain', () => {
    expect(fixture.nativeElement.textContent).toContain('ותן ברכה');
  });

  it('should update when inputs change', () => {
    host.candleLighting.set('17:45');
    host.seasonRain.set('ברך עלינו');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('17:45');
    expect(fixture.nativeElement.textContent).toContain('ברך עלינו');
  });
});
