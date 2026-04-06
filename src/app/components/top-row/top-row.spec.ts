import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { TopRow } from './top-row';

@Component({
  template: `
    <app-top-row
      [hebrewDate]="hebrewDate()"
      [dedication]="dedication()"
      [gregorianDate]="gregorianDate()"
    />
  `,
  imports: [TopRow],
})
class TestHost {
  hebrewDate = signal('ז׳ ניסן תשפ״ו');
  dedication = signal('לע״נ אליהו');
  gregorianDate = signal('06/04/2026');
}

describe('TopRow', () => {
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
      (el) => el.name === 'app-top-row'
    )).toBeTruthy();
  });

  it('should display hebrew date', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ז׳ ניסן תשפ״ו');
  });

  it('should display dedication', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('לע״נ אליהו');
  });

  it('should display gregorian date', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('06/04/2026');
  });

  it('should update when inputs change', () => {
    host.hebrewDate.set('ח׳ ניסן תשפ״ו');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('ח׳ ניסן תשפ״ו');
  });
});
