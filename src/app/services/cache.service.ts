import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';

export interface DayCache {
  hebrewDate: string;
  zmanim: Record<string, string>;
  parasha: string | null;
  omer: string | null;
  candleLighting: string | null;
  havdalah: string | null;
  dafYomi: string;
}

interface YearCache {
  geonameid: number;
  year: number;
  days: Record<string, DayCache>;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private http = inject(HttpClient);
  private yearCache = new Map<number, YearCache>();

  getDayData(dateStr: string): Observable<DayCache | null> {
    const year = parseInt(dateStr.substring(0, 4), 10);

    const cached = this.yearCache.get(year);
    if (cached) {
      return of(cached.days[dateStr] || null);
    }

    return this.http.get<YearCache>(`assets/cache/${year}.json`).pipe(
      map((data) => {
        this.yearCache.set(year, data);
        return data.days[dateStr] || null;
      }),
      catchError(() => of(null)),
    );
  }
}
