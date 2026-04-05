import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { ConfigService } from '../../services/config.service';

const HEBREW_DAYS = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת קודש'];

@Component({
  selector: 'app-clock',
  templateUrl: './clock.html',
  styleUrl: './clock.css',
})
export class Clock implements OnInit, OnDestroy {
  private config = inject(ConfigService);

  readonly blinkColon = this.config.blinkColon;
  readonly dayFontSize = this.config.clockDayFontSize;
  readonly hourFontSize = this.config.clockHourFontSize;
  readonly minuteFontSize = this.config.clockMinuteFontSize;
  readonly secondFontSize = this.config.clockSecondFontSize;

  clockHr = signal('00');
  clockMin = signal('00');
  clockSec = signal('00');
  dayName = signal('יום ...');

  private interval: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.interval = setInterval(() => this.updateClock(), 1000);
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }

  private updateClock(): void {
    const now = new Date();
    this.clockHr.set(String(now.getHours()).padStart(2, '0'));
    this.clockMin.set(String(now.getMinutes()).padStart(2, '0'));
    this.clockSec.set(String(now.getSeconds()).padStart(2, '0'));
    this.dayName.set(HEBREW_DAYS[now.getDay()]);
  }
}
