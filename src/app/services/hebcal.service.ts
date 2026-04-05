import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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


@Injectable({ providedIn: 'root' })
export class HebcalService {
  private http = inject(HttpClient);

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
    const date = this.fmtDate(new Date());
    return this.http.get<{ hebrew?: string }>(
      `https://www.hebcal.com/converter?cfg=json&date=${date}&g2h=1&strict=1`
    );
  }

  fetchZmanim(geonameid: number): Observable<ZmanItem[]> {
    const date = this.fmtDate(new Date());
    return new Observable<ZmanItem[]>((subscriber) => {
      this.http
        .get<{ times?: Record<string, string> }>(
          `https://www.hebcal.com/zmanim?cfg=json&date=${date}&geonameid=${geonameid}`
        )
        .subscribe({
          next: (data) => {
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
            subscriber.next(items);
            subscriber.complete();
          },
          error: (err) => subscriber.error(err),
        });
    });
  }

  fetchParashaAndShabbat(geonameid: number): Observable<ParashaResult> {
    const now = new Date();
    const start = this.fmtDate(now);
    const endD = new Date(now);
    endD.setDate(endD.getDate() + 7);

    return new Observable<ParashaResult>((subscriber) => {
      this.http
        .get<{ items?: any[] }>(
          `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on` +
          `&year=now&month=now&ss=on&mf=on&c=on&geo=geoname&geonameid=${geonameid}` +
          `&M=on&s=on&o=on&b=20&start=${start}&end=${this.fmtDate(endD)}&lg=he`
        )
        .subscribe({
          next: (data) => {
            const items = data.items || [];
            const parasha = items.find((i: any) => i.category === 'parashat');
            const holiday = items.find((i: any) => i.category === 'holiday' && i.subcat === 'major');
            const candles = items.find((i: any) => i.category === 'candles');
            const havdalahItem = items.find((i: any) => i.category === 'havdalah');
            const todayStr = this.fmtDate(new Date());
            const omer = items.find((i: any) => i.category === 'omer' && i.date === todayStr);

            let parashaName = '---';
            if (parasha) {
              parashaName = parasha.hebrew || parasha.title;
            } else if (holiday) {
              parashaName = holiday.hebrew || holiday.title;
            }

            subscriber.next({
              parashaName,
              showOmer: !!omer,
              omerCount: omer ? (omer.hebrew || omer.title) : '',
              candleLighting: candles ? this.fmtTime(candles.date) : '',
              havdalah: havdalahItem ? this.fmtTime(havdalahItem.date) : '',
            });
            subscriber.complete();
          },
          error: (err) => subscriber.error(err),
        });
    });
  }

  fetchDafYomi(): Observable<string> {
    return new Observable<string>((subscriber) => {
      this.http
        .get<{ calendar_items?: any[] }>('https://www.sefaria.org/api/calendars')
        .subscribe({
          next: (data) => {
            const items = data.calendar_items || [];
            const daf = items.find((i: any) => i.title?.en === 'Daf Yomi');
            subscriber.next(daf ? (daf.displayValue?.he || daf.displayValue?.en || '---') : '---');
            subscriber.complete();
          },
          error: (err) => subscriber.error(err),
        });
    });
  }

  getSeasonPrayer(): { wind: string; rain: string } {
    const m = new Date().getMonth();
    if (m >= 3 && m <= 9) return { wind: 'מוריד הטל', rain: 'ותן ברכה' };
    return { wind: 'משיב הרוח ומוריד הגשם', rain: 'ברך עלינו' };
  }
}
