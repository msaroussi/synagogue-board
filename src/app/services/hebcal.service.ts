import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CacheService } from './cache.service';
import { LocalComputeService } from './local-compute.service';

export interface ZmanItem {
  label: string;
  value: string;
}

export interface ParashaResult {
  parashaName: string;
  showOmer: boolean;
  omerCount: string;
  candleLighting: string;
  havdalah: string;
}

export interface FontSizesConfig {
  zmanimBarTitle: string;
  zmanimBarValue: string;
  topRowHebrewDate: string;
  topRowDedication: string;
  topRowGregorianDate: string;
  shabbatInfoLine: string;
  dailyInfoParashaLabel: string;
  dailyInfoParashaValue: string;
  dailyInfoLine: string;
  clockDay: string;
  clockHour: string;
  clockMinute: string;
  clockSecond: string;
}

export interface BoardConfig {
  geonameid: number;
  cityName: string;
  dedication: string;
  refreshMinutes: number;
  blinkColon: boolean;
  fontSizes: FontSizesConfig;
}

const DEFAULT_LAT = 31.7683;
const DEFAULT_LON = 35.2137;
const DEFAULT_TZID = 'Asia/Jerusalem';

const ZMAN_LABELS: Record<string, string> = {
  alotHaShachar: 'עלות השחר',
  sunrise: 'הנץ החמה',
  sofZmanShmaMGA: 'סוז״ק מג״א',
  sofZmanShma: 'סוז״ק גר״א',
  sofZmanTfilla: 'סוף זמן תפילה',
  chatzot: 'חצות',
  minchaGedola: 'מנחה גדולה',
  minchaKetana: 'מנחה קטנה',
  plagHaMincha: 'פלג המנחה',
  sunset: 'שקיעה',
  tzeit: 'צאת הכוכבים',
};

@Injectable({ providedIn: 'root' })
export class HebcalService {
  private http = inject(HttpClient);
  private cache = inject(CacheService);
  private localCompute = inject(LocalComputeService);

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private fmtTime(isoStr: string | undefined): string {
    if (!isoStr) return '--:--';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  fetchHebrewDate(): Observable<{ hebrew?: string }> {
    const now = new Date();
    const date = this.fmtDate(now);
    return this.http.get<{ hebrew?: string }>(
      `https://www.hebcal.com/converter?cfg=json&date=${date}&g2h=1&strict=1`
    ).pipe(
      catchError(() =>
        this.cache.getDayData(date).pipe(
          switchMap((cached) => {
            if (cached) return of({ hebrew: cached.hebrewDate });
            const local = this.localCompute.computeDay(now, DEFAULT_LAT, DEFAULT_LON, DEFAULT_TZID);
            return of({ hebrew: local.hebrewDate });
          }),
        ),
      ),
    );
  }

  fetchZmanim(geonameid: number): Observable<ZmanItem[]> {
    const now = new Date();
    const date = this.fmtDate(now);
    const zmanimOrder = [
      'alotHaShachar', 'sunrise', 'sofZmanShmaMGA', 'sofZmanShma',
      'sofZmanTfilla', 'chatzot', 'minchaGedola', 'minchaKetana',
      'plagHaMincha', 'sunset', 'tzeit',
    ];

    const buildItems = (t: Record<string, string>): ZmanItem[] =>
      zmanimOrder
        .filter((key) => t[key])
        .map((key) => ({ label: ZMAN_LABELS[key], value: t[key] }));

    return this.http
      .get<{ times?: Record<string, string> }>(
        `https://www.hebcal.com/zmanim?cfg=json&date=${date}&geonameid=${geonameid}`
      )
      .pipe(
        switchMap((data) => {
          const t = data.times || {};
          const defs: { label: string; val: string | undefined }[] = [
            { label: 'עלות השחר', val: t['alotHaShachar'] },
            { label: 'הנץ החמה', val: t['sunrise'] },
            { label: 'סוז״ק מג״א', val: t['sofZmanShmaMGA'] },
            { label: 'סוז״ק גר״א', val: t['sofZmanShma'] },
            { label: 'סוף זמן תפילה', val: t['sofZmanTfilla'] },
            { label: 'חצות', val: t['chatzot'] },
            { label: 'מנחה גדולה', val: t['minchaGedola'] },
            { label: 'מנחה קטנה', val: t['minchaKetana'] },
            { label: 'פלג המנחה', val: t['plagHaMincha'] },
            { label: 'שקיעה', val: t['sunset'] },
            { label: 'צאת הכוכבים', val: t['tzeit'] },
          ];
          const items = defs
            .filter((z) => z.val)
            .map((z) => ({ label: z.label, value: this.fmtTime(z.val) }));
          return of(items);
        }),
        catchError(() =>
          this.cache.getDayData(date).pipe(
            switchMap((cached) => {
              if (cached) return of(buildItems(cached.zmanim));
              const local = this.localCompute.computeDay(now, DEFAULT_LAT, DEFAULT_LON, DEFAULT_TZID);
              return of(buildItems(local.zmanim));
            }),
          ),
        ),
      );
  }

  fetchParashaAndShabbat(geonameid: number): Observable<ParashaResult> {
    const now = new Date();
    const start = this.fmtDate(now);
    const endD = new Date(now);
    endD.setDate(endD.getDate() + 7);
    const todayStr = this.fmtDate(now);

    const buildFromLocal = (data: { parasha: string | null; omer: string | null; candleLighting: string | null; havdalah: string | null }): ParashaResult => ({
      parashaName: data.parasha || '---',
      showOmer: !!data.omer,
      omerCount: data.omer || '',
      candleLighting: data.candleLighting || '',
      havdalah: data.havdalah || '',
    });

    return this.http
      .get<{ items?: any[] }>(
        `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on` +
        `&year=now&month=now&ss=on&mf=on&c=on&geo=geoname&geonameid=${geonameid}` +
        `&M=on&s=on&o=on&b=20&start=${start}&end=${this.fmtDate(endD)}&lg=he`
      )
      .pipe(
        switchMap((data) => {
          const items = data.items || [];
          const parasha = items.find((i: any) => i.category === 'parashat');
          const holiday = items.find((i: any) => i.category === 'holiday' && i.subcat === 'major');
          const candles = items.find((i: any) => i.category === 'candles');
          const havdalahItem = items.find((i: any) => i.category === 'havdalah');
          const omer = items.find((i: any) => i.category === 'omer' && i.date === todayStr);

          let parashaName = '---';
          if (parasha) {
            parashaName = parasha.hebrew || parasha.title;
          } else if (holiday) {
            parashaName = holiday.hebrew || holiday.title;
          }

          return of({
            parashaName,
            showOmer: !!omer,
            omerCount: omer ? (omer.hebrew || omer.title) : '',
            candleLighting: candles ? this.fmtTime(candles.date) : '',
            havdalah: havdalahItem ? this.fmtTime(havdalahItem.date) : '',
          });
        }),
        catchError(() =>
          this.cache.getDayData(todayStr).pipe(
            switchMap((cached) => {
              if (cached) return of(buildFromLocal(cached));
              const local = this.localCompute.computeDay(now, DEFAULT_LAT, DEFAULT_LON, DEFAULT_TZID);
              return of(buildFromLocal(local));
            }),
          ),
        ),
      );
  }

  fetchDafYomi(): Observable<string> {
    const now = new Date();
    const date = this.fmtDate(now);
    return this.http
      .get<{ calendar_items?: any[] }>('https://www.sefaria.org/api/calendars')
      .pipe(
        switchMap((data) => {
          const items = data.calendar_items || [];
          const daf = items.find((i: any) => i.title?.en === 'Daf Yomi');
          return of(daf ? (daf.displayValue?.he || daf.displayValue?.en || '---') : '---');
        }),
        catchError(() =>
          this.cache.getDayData(date).pipe(
            switchMap((cached) => {
              if (cached) return of(cached.dafYomi);
              const local = this.localCompute.computeDay(now, DEFAULT_LAT, DEFAULT_LON, DEFAULT_TZID);
              return of(local.dafYomi);
            }),
          ),
        ),
      );
  }

  getSeasonPrayer(): { wind: string; rain: string } {
    const m = new Date().getMonth();
    if (m >= 3 && m <= 9) return { wind: 'מוריד הטל', rain: 'ותן ברכה' };
    return { wind: 'משיב הרוח ומוריד הגשם', rain: 'ברך עלינו' };
  }
}
