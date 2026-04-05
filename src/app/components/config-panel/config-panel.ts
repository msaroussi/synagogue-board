import { Component, inject, HostListener } from '@angular/core';
import { ConfigService, FontSizeKey } from '../../services/config.service';

@Component({
  selector: 'app-config-panel',
  templateUrl: './config-panel.html',
  styleUrl: './config-panel.css',
})
export class ConfigPanel {
  readonly config = inject(ConfigService);
  panelOpen = false;
  gearVisible = false;

  panelX = 10;
  panelY = 50;
  private dragging = false;
  private dragOffsetX = 0;
  private dragOffsetY = 0;

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.altKey && event.code === 'KeyC') {
      event.preventDefault();
      this.gearVisible = !this.gearVisible;
      if (!this.gearVisible) this.panelOpen = false;
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.dragging) return;
    this.panelX = event.clientX - this.dragOffsetX;
    this.panelY = event.clientY - this.dragOffsetY;
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.dragging = false;
  }

  onHeaderMouseDown(event: MouseEvent): void {
    this.dragging = true;
    this.dragOffsetX = event.clientX - this.panelX;
    this.dragOffsetY = event.clientY - this.panelY;
    event.preventDefault();
  }

  readonly fontSizeItems: { key: FontSizeKey; label: string }[] = [
    { key: 'zmanimBarTitle', label: 'זמנים - כותרות' },
    { key: 'zmanimBarValue', label: 'זמנים - ערכים' },
    { key: 'topRowHebrewDate', label: 'תאריך עברי' },
    { key: 'topRowDedication', label: 'הקדשה' },
    { key: 'topRowGregorianDate', label: 'תאריך לועזי' },
    { key: 'shabbatInfoLine', label: 'מידע שבת' },
    { key: 'dailyInfoParashaLabel', label: 'פרשה - כותרת' },
    { key: 'dailyInfoParashaValue', label: 'פרשה - שם' },
    { key: 'dailyInfoLine', label: 'מידע יומי' },
    { key: 'clockDay', label: 'שעון - יום' },
    { key: 'clockHour', label: 'שעון - שעה' },
    { key: 'clockMinute', label: 'שעון - דקה' },
    { key: 'clockSecond', label: 'שעון - שניה' },
  ];

  onGeoChange(value: string): void {
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      this.config.updateGeonameid(num);
    }
  }
}
