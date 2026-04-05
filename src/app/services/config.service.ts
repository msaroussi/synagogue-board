import { Injectable, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import BOARD_CONFIG from '../app.config.json';

const STORAGE_KEY = 'synagogue-board-config';
const BASE_FONT_SIZES = BOARD_CONFIG.fontSizes;

export type FontSizeKey = keyof typeof BASE_FONT_SIZES;
export const FONT_SIZE_KEYS = Object.keys(BASE_FONT_SIZES) as FontSizeKey[];

interface StoredConfig {
  geonameid: number;
  cityName: string;
  dedication: string;
  blinkColon: boolean;
  boardWidth: string;
  boardHeight: string;
  fontSizePercents: Record<string, number>;
}

function defaultPercents(): Record<FontSizeKey, number> {
  return Object.fromEntries(FONT_SIZE_KEYS.map(k => [k, 100])) as Record<FontSizeKey, number>;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  readonly geonameid = signal(BOARD_CONFIG.geonameid);
  readonly cityName = signal(BOARD_CONFIG.cityName);
  readonly dedication = signal(BOARD_CONFIG.dedication);
  readonly blinkColon = signal(BOARD_CONFIG.blinkColon);
  readonly boardWidth = signal(BOARD_CONFIG.boardWidth);
  readonly boardHeight = signal(BOARD_CONFIG.boardHeight);
  readonly fontSizePercents = signal<Record<FontSizeKey, number>>(defaultPercents());

  private readonly _reload = new Subject<void>();
  readonly reload$ = this._reload.asObservable();

  readonly zmanimBarTitleFontSize = computed(() => this.calcFont('zmanimBarTitle'));
  readonly zmanimBarValueFontSize = computed(() => this.calcFont('zmanimBarValue'));
  readonly topRowHebrewDateFontSize = computed(() => this.calcFont('topRowHebrewDate'));
  readonly topRowDedicationFontSize = computed(() => this.calcFont('topRowDedication'));
  readonly topRowGregorianDateFontSize = computed(() => this.calcFont('topRowGregorianDate'));
  readonly shabbatInfoLineFontSize = computed(() => this.calcFont('shabbatInfoLine'));
  readonly dailyInfoParashaLabelFontSize = computed(() => this.calcFont('dailyInfoParashaLabel'));
  readonly dailyInfoParashaValueFontSize = computed(() => this.calcFont('dailyInfoParashaValue'));
  readonly dailyInfoLineFontSize = computed(() => this.calcFont('dailyInfoLine'));
  readonly clockDayFontSize = computed(() => this.calcFont('clockDay'));
  readonly clockHourFontSize = computed(() => this.calcFont('clockHour'));
  readonly clockMinuteFontSize = computed(() => this.calcFont('clockMinute'));
  readonly clockSecondFontSize = computed(() => this.calcFont('clockSecond'));

  constructor() {
    this.loadFromStorage();
  }

  private calcFont(key: FontSizeKey): string {
    const pct = this.fontSizePercents()[key];
    if (pct === 100) return BASE_FONT_SIZES[key];
    return `calc(${BASE_FONT_SIZES[key]} * ${pct / 100})`;
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveToStorage();
        return;
      }
      const stored: Partial<StoredConfig> = JSON.parse(raw);
      if (stored.geonameid != null) this.geonameid.set(stored.geonameid);
      if (stored.cityName != null) this.cityName.set(stored.cityName);
      if (stored.dedication != null) this.dedication.set(stored.dedication);
      if (stored.blinkColon != null) this.blinkColon.set(stored.blinkColon);
      if (stored.boardWidth != null) this.boardWidth.set(stored.boardWidth);
      if (stored.boardHeight != null) this.boardHeight.set(stored.boardHeight);
      if (stored.fontSizePercents) {
        this.fontSizePercents.set({
          ...defaultPercents(),
          ...stored.fontSizePercents,
        } as Record<FontSizeKey, number>);
      }
    } catch {
      this.saveToStorage();
    }
  }

  private saveToStorage(): void {
    const config: StoredConfig = {
      geonameid: this.geonameid(),
      cityName: this.cityName(),
      dedication: this.dedication(),
      blinkColon: this.blinkColon(),
      boardWidth: this.boardWidth(),
      boardHeight: this.boardHeight(),
      fontSizePercents: this.fontSizePercents(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }

  updateGeonameid(value: number): void {
    this.geonameid.set(value);
    this.saveToStorage();
    this._reload.next();
  }

  updateCityName(value: string): void {
    this.cityName.set(value);
    this.saveToStorage();
  }

  updateDedication(value: string): void {
    this.dedication.set(value);
    this.saveToStorage();
  }

  updateBoardWidth(value: string): void {
    this.boardWidth.set(value);
    this.saveToStorage();
  }

  updateBoardHeight(value: string): void {
    this.boardHeight.set(value);
    this.saveToStorage();
  }

  adjustBoardSize(dimension: 'width' | 'height', delta: number): void {
    const sig = dimension === 'width' ? this.boardWidth : this.boardHeight;
    const match = sig().match(/^([\d.]+)(.*)$/);
    if (!match) return;
    const num = Math.max(1, parseFloat(match[1]) + delta);
    sig.set(`${num}${match[2]}`);
    this.saveToStorage();
  }

  toggleBlinkColon(): void {
    this.blinkColon.update(v => !v);
    this.saveToStorage();
  }

  adjustFontSize(key: FontSizeKey, delta: number): void {
    this.fontSizePercents.update(current => ({
      ...current,
      [key]: Math.max(50, Math.min(200, current[key] + delta)),
    }));
    this.saveToStorage();
  }

  resetToDefaults(): void {
    this.geonameid.set(BOARD_CONFIG.geonameid);
    this.cityName.set(BOARD_CONFIG.cityName);
    this.dedication.set(BOARD_CONFIG.dedication);
    this.blinkColon.set(BOARD_CONFIG.blinkColon);
    this.boardWidth.set(BOARD_CONFIG.boardWidth);
    this.boardHeight.set(BOARD_CONFIG.boardHeight);
    this.fontSizePercents.set(defaultPercents());
    this.saveToStorage();
    this._reload.next();
  }
}
