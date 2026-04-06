import { Injectable } from '@angular/core';
import { HDate, Zmanim, HebrewCalendar, Location, GeoLocation, flags } from '@hebcal/core';
import { DafYomi } from '@hebcal/learning';

export interface LocalDayData {
  hebrewDate: string;
  zmanim: Record<string, string>;
  parasha: string | null;
  omer: string | null;
  candleLighting: string | null;
  havdalah: string | null;
  dafYomi: string;
}

@Injectable({ providedIn: 'root' })
export class LocalComputeService {

  computeDay(date: Date, latitude: number, longitude: number, tzid: string): LocalDayData {
    const hd = new HDate(date);
    const location = new Location(latitude, longitude, false, tzid);
    const gloc = new GeoLocation(null, latitude, longitude, 0, tzid);
    const zmanim = new Zmanim(gloc, date, false);

    // Hebrew date
    const hebrewDate = hd.renderGematriya(true);

    // Zmanim
    const zmanimMap: Record<string, string> = {};
    const zmanimDefs: [string, Date | null][] = [
      ['alotHaShachar', zmanim.alotHaShachar()],
      ['sunrise', zmanim.sunrise()],
      ['sofZmanShmaMGA', zmanim.sofZmanShmaMGA()],
      ['sofZmanShma', zmanim.sofZmanShma()],
      ['sofZmanTfilla', zmanim.sofZmanTfilla()],
      ['chatzot', zmanim.chatzot()],
      ['minchaGedola', zmanim.minchaGedola()],
      ['minchaKetana', zmanim.minchaKetana()],
      ['plagHaMincha', zmanim.plagHaMincha()],
      ['sunset', zmanim.sunset()],
      ['tzeit', zmanim.tzeit()],
    ];
    for (const [key, val] of zmanimDefs) {
      if (val && !isNaN(val.getTime())) {
        zmanimMap[key] = val.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzid });
      }
    }

    // Events (parasha, omer, candle lighting, havdalah)
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 7);

    const events = HebrewCalendar.calendar({
      start: startDate,
      end: endDate,
      location,
      sedrot: true,
      candlelighting: true,
      omer: true,
      locale: 'he',
    });

    let parasha: string | null = null;
    let omer: string | null = null;
    let candleLighting: string | null = null;
    let havdalah: string | null = null;

    const dateStr = this.fmtDate(date);

    for (const ev of events) {
      const mask = ev.getFlags();
      if (mask & flags.PARSHA_HASHAVUA) {
        parasha = ev.renderBrief('he');
      }
      if ((mask & flags.OMER_COUNT) && this.fmtDate(ev.getDate().greg()) === dateStr) {
        omer = ev.renderBrief('he');
      }
      if (mask & flags.LIGHT_CANDLES) {
        const eventTime = (ev as { eventTime?: Date }).eventTime;
        if (eventTime) {
          candleLighting = eventTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzid });
        }
      }
      if (mask & flags.LIGHT_CANDLES_TZEIS) {
        const eventTime = (ev as { eventTime?: Date }).eventTime;
        if (eventTime) {
          havdalah = eventTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tzid });
        }
      }
    }

    // Daf Yomi
    const dafYomiObj = new DafYomi(hd);
    const dafYomi = dafYomiObj.render('he');

    return { hebrewDate, zmanim: zmanimMap, parasha, omer, candleLighting, havdalah, dafYomi };
  }

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
