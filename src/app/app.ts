import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { HebcalService, ZmanItem, BOARD_CONFIG } from './services/hebcal.service';
import { TopRow } from './components/top-row/top-row';
import { DailyInfo } from './components/daily-info/daily-info';
import { Clock } from './components/clock/clock';
import { ShabbatInfo } from './components/shabbat-info/shabbat-info';
import { ZmanimBar } from './components/zmanim-bar/zmanim-bar';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  imports: [TopRow, DailyInfo, Clock, ShabbatInfo, ZmanimBar],
})
export class App implements OnInit, OnDestroy {
  private hebcal = inject(HebcalService);

  readonly dedication = BOARD_CONFIG.dedication;

  gregorianDate = signal('--/--/----');

  hebrewDate = signal('טוען...');
  parashaName = signal('טוען...');
  dafYomi = signal('טוען...');
  seasonWind = signal('משיב הרוח');
  seasonRain = signal('');

  showOmer = signal(false);
  omerCount = signal('');
  candleLighting = signal('');
  havdalahTime = signal('');

  zmanim = signal<ZmanItem[]>([]);
  zmanimLoading = signal(true);
  zmanimError = signal(false);
  dataLoaded = signal(false);

  private refreshInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateDate();
    this.loadAll();
    this.refreshInterval = setInterval(() => {
      this.updateDate();
      this.loadAll();
    }, BOARD_CONFIG.refreshMinutes * 60 * 1000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private updateDate(): void {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    this.gregorianDate.set(`${dd}/${mm}/${now.getFullYear()}`);
  }

  private loadAll(): void {
    const season = this.hebcal.getSeasonPrayer();
    this.seasonWind.set(season.wind);
    this.seasonRain.set(season.rain);

    this.hebcal.fetchHebrewDate().subscribe({
      next: (data) => this.hebrewDate.set(data.hebrew || '---'),
      error: () => this.hebrewDate.set('---'),
    });

    this.hebcal.fetchZmanim(BOARD_CONFIG.geonameid).subscribe({
      next: (items) => {
        this.zmanim.set(items);
        this.zmanimLoading.set(false);
        this.zmanimError.set(items.length === 0);
      },
      error: () => {
        this.zmanimLoading.set(false);
        this.zmanimError.set(true);
      },
    });

    this.hebcal.fetchParashaAndShabbat(BOARD_CONFIG.geonameid).subscribe({
      next: (result) => {
        this.parashaName.set(result.parashaName);
        this.showOmer.set(result.showOmer);
        this.omerCount.set(result.omerCount);
        this.candleLighting.set(result.candleLighting);
        this.havdalahTime.set(result.havdalah);
        this.dataLoaded.set(true);
      },
      error: () => {
        this.parashaName.set('---');
        this.dataLoaded.set(true);
      },
    });

    this.hebcal.fetchDafYomi().subscribe({
      next: (name) => this.dafYomi.set(name),
      error: () => this.dafYomi.set('---'),
    });
  }
}
