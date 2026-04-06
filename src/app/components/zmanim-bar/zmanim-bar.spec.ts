import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { ZmanimBar } from './zmanim-bar';
import { ZmanItem } from '../../services/hebcal.service';

@Component({
  template: `
    <app-zmanim-bar
      [zmanimLoading]="zmanimLoading()"
      [zmanimError]="zmanimError()"
      [zmanim]="zmanim()"
    />
  `,
  imports: [ZmanimBar],
})
class TestHost {
  zmanimLoading = signal(false);
  zmanimError = signal(false);
  zmanim = signal<ZmanItem[]>([
    { label: 'הנץ החמה', value: '06:15' },
    { label: 'שקיעה', value: '19:00' },
  ]);
}

describe('ZmanimBar', () => {
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
      (el) => el.name === 'app-zmanim-bar'
    )).toBeTruthy();
  });

  it('should display zmanim items', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('הנץ החמה');
    expect(text).toContain('06:15');
    expect(text).toContain('שקיעה');
    expect(text).toContain('19:00');
  });

  it('should update when zmanim change', () => {
    host.zmanim.set([{ label: 'חצות', value: '12:30' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('חצות');
    expect(fixture.nativeElement.textContent).toContain('12:30');
  });
});
