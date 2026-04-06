import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { DailyInfo } from './daily-info';

@Component({
  template: `
    <app-daily-info
      [parashaName]="parashaName()"
      [showOmer]="showOmer()"
      [omerCount]="omerCount()"
      [seasonWind]="seasonWind()"
      [dafYomi]="dafYomi()"
    />
  `,
  imports: [DailyInfo],
})
class TestHost {
  parashaName = signal('צו');
  showOmer = signal(true);
  omerCount = signal('היום שבעה ימים');
  seasonWind = signal('מוריד הטל');
  dafYomi = signal('פסחים דף ק״כ');
}

describe('DailyInfo', () => {
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
      (el) => el.name === 'app-daily-info'
    )).toBeTruthy();
  });

  it('should display parasha name', () => {
    expect(fixture.nativeElement.textContent).toContain('צו');
  });

  it('should display omer count when showOmer is true', () => {
    expect(fixture.nativeElement.textContent).toContain('היום שבעה ימים');
  });

  it('should hide omer count when showOmer is false', () => {
    host.showOmer.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('היום שבעה ימים');
  });

  it('should display season wind', () => {
    expect(fixture.nativeElement.textContent).toContain('מוריד הטל');
  });

  it('should display daf yomi', () => {
    expect(fixture.nativeElement.textContent).toContain('פסחים דף ק״כ');
  });

  it('should update when inputs change', () => {
    host.parashaName.set('שמיני');
    host.dafYomi.set('שקלים דף ה');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('שמיני');
    expect(fixture.nativeElement.textContent).toContain('שקלים דף ה');
  });
});
