# Offline PWA Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the synagogue board a full offline PWA with 3-tier data fallback (API -> JSON cache -> local computation) and self-hosted fonts.

**Architecture:** Replace Google Fonts with local woff2 files. Refactor `HebcalService` to try API first, then fall back to yearly JSON cache files bundled in assets, then compute locally with `@hebcal/core`. Add Angular PWA with Service Worker for full offline app shell caching. Provide a cache generation script that fetches from hebcal.com/sefaria.org APIs.

**Tech Stack:** Angular 21, `@hebcal/core`, `@angular/service-worker`, `ts-node`

---

## File Structure

| File | Purpose |
|---|---|
| `src/assets/fonts/*.woff2` | Self-hosted Heebo + Secular One font files |
| `src/styles.css` | Add `@font-face` declarations |
| `src/index.html` | Remove Google Fonts links, add manifest link |
| `src/app/services/hebcal.service.ts` | Refactor to 3-tier fallback chain |
| `src/app/services/cache.service.ts` | New — loads and queries yearly JSON cache |
| `src/app/services/local-compute.service.ts` | New — computes data with `@hebcal/core` |
| `scripts/generate-cache.ts` | New — fetches API data and writes yearly JSON files |
| `src/assets/cache/*.json` | Generated yearly cache files |
| `src/app/app.config.ts` | Register Service Worker |
| `src/manifest.webmanifest` | PWA manifest |
| `ngsw-config.json` | Service Worker caching config |
| `src/assets/icons/icon-192x192.png` | PWA icon |
| `src/assets/icons/icon-512x512.png` | PWA icon |
| `package.json` | New deps + scripts |

---

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install runtime dependencies**

```bash
npm install @hebcal/core @angular/service-worker
```

- [ ] **Step 2: Install dev dependencies**

```bash
npm install --save-dev ts-node @types/node
```

- [ ] **Step 3: Verify installation**

Run: `npm ls @hebcal/core @angular/service-worker ts-node`
Expected: All three packages listed without errors.

- [ ] **Step 4: Add prebuild and generate-cache scripts to package.json**

In `package.json`, add to `"scripts"`:

```json
"prebuild": "ts-node scripts/generate-cache.ts --prebuild",
"generate-cache": "ts-node scripts/generate-cache.ts"
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @hebcal/core, @angular/service-worker, ts-node dependencies"
```

---

### Task 2: Self-Host Fonts

**Files:**
- Create: `src/assets/fonts/` (woff2 files)
- Modify: `src/styles.css`
- Modify: `src/index.html`
- Modify: `angular.json`

- [ ] **Step 1: Download Heebo woff2 files**

Download Heebo font files (weights 300, 400, 500, 700, 900) in woff2 format from Google Fonts API. Save to `src/assets/fonts/`:

```bash
mkdir -p src/assets/fonts
curl -o src/assets/fonts/heebo-300.woff2 "https://fonts.gstatic.com/s/heebo/v26/NGS6v5_NC0k9P9H0TbFhsqMA.woff2"
curl -o src/assets/fonts/heebo-400.woff2 "https://fonts.gstatic.com/s/heebo/v26/NGS6v5_NC0k9P9H2TbFhsqMA.woff2"
curl -o src/assets/fonts/heebo-500.woff2 "https://fonts.gstatic.com/s/heebo/v26/NGS6v5_NC0k9P9HeTbFhsqMA.woff2"
curl -o src/assets/fonts/heebo-700.woff2 "https://fonts.gstatic.com/s/heebo/v26/NGS6v5_NC0k9P9GCT7FhsqMA.woff2"
curl -o src/assets/fonts/heebo-900.woff2 "https://fonts.gstatic.com/s/heebo/v26/NGS6v5_NC0k9P9GyTrFhsqMA.woff2"
```

- [ ] **Step 2: Download Secular One woff2 file**

```bash
curl -o src/assets/fonts/secular-one-400.woff2 "https://fonts.gstatic.com/s/secularone/v12/8QINdiTajsj_87rMuMdKyqDiOOhZKcg.woff2"
```

- [ ] **Step 3: Verify font files exist**

```bash
ls -la src/assets/fonts/
```

Expected: 6 woff2 files present.

- [ ] **Step 4: Add @font-face declarations to styles.css**

Add at the top of `src/styles.css`, before the `:root` block:

```css
/* Heebo - self-hosted */
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url('assets/fonts/heebo-300.woff2') format('woff2');
}
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('assets/fonts/heebo-400.woff2') format('woff2');
}
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url('assets/fonts/heebo-500.woff2') format('woff2');
}
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url('assets/fonts/heebo-700.woff2') format('woff2');
}
@font-face {
  font-family: 'Heebo';
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url('assets/fonts/heebo-900.woff2') format('woff2');
}

/* Secular One - self-hosted */
@font-face {
  font-family: 'Secular One';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('assets/fonts/secular-one-400.woff2') format('woff2');
}
```

- [ ] **Step 5: Remove Google Fonts links from index.html**

In `src/index.html`, remove these three lines (lines 7-9):

```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;700;900&family=Secular+One&display=swap" rel="stylesheet">
```

- [ ] **Step 6: Add fonts to angular.json assets**

In `angular.json`, in `projects.synagogue-board.architect.build.options.assets`, add:

```json
{
  "glob": "**/*",
  "input": "src/assets",
  "output": "assets"
}
```

- [ ] **Step 7: Verify build works**

```bash
npm run build
```

Expected: Build succeeds without errors.

- [ ] **Step 8: Commit**

```bash
git add src/assets/fonts/ src/styles.css src/index.html angular.json
git commit -m "feat: self-host Heebo and Secular One fonts, remove Google Fonts CDN"
```

---

### Task 3: Cache Generation Script

**Files:**
- Create: `scripts/generate-cache.ts`
- Create: `tsconfig.scripts.json`

- [ ] **Step 1: Create tsconfig for scripts**

Create `tsconfig.scripts.json` at project root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist-scripts"
  },
  "include": ["scripts/**/*.ts"]
}
```

- [ ] **Step 2: Create generate-cache.ts**

Create `scripts/generate-cache.ts`:

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

interface DayCache {
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

const ZMAN_KEYS = [
  'alotHaShachar', 'sunrise', 'sofZmanShmaMGA', 'sofZmanShma',
  'sofZmanTfilla', 'chatzot', 'minchaGedola', 'minchaKetana',
  'plagHaMincha', 'sunset', 'tzeit',
];

const CACHE_DIR = path.resolve(__dirname, '..', 'src', 'assets', 'cache');

function parseArgs(): { startYear: number; endYear: number; geonameid: number; force: boolean; prebuild: boolean } {
  const args = process.argv.slice(2);
  let startYear = new Date().getFullYear();
  let endYear = startYear + 10;
  let geonameid = 281184; // Jerusalem default
  let force = false;
  let prebuild = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--years' && args[i + 1]) {
      const parts = args[i + 1].split('-');
      startYear = parseInt(parts[0], 10);
      endYear = parts[1] ? parseInt(parts[1], 10) : startYear;
      i++;
    } else if (args[i] === '--geonameid' && args[i + 1]) {
      geonameid = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--prebuild') {
      prebuild = true;
    }
  }

  return { startYear, endYear, geonameid, force, prebuild };
}

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fmtTime(isoStr: string | undefined): string {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

async function fetchHebrewDate(dateStr: string): Promise<string> {
  try {
    const raw = await httpsGet(`https://www.hebcal.com/converter?cfg=json&date=${dateStr}&g2h=1&strict=1`);
    const data = JSON.parse(raw);
    return data.hebrew || '---';
  } catch {
    return '---';
  }
}

async function fetchZmanim(dateStr: string, geonameid: number): Promise<Record<string, string>> {
  try {
    const raw = await httpsGet(`https://www.hebcal.com/zmanim?cfg=json&date=${dateStr}&geonameid=${geonameid}`);
    const data = JSON.parse(raw);
    const times = data.times || {};
    const result: Record<string, string> = {};
    for (const key of ZMAN_KEYS) {
      const formatted = fmtTime(times[key]);
      if (formatted) result[key] = formatted;
    }
    return result;
  } catch {
    return {};
  }
}

async function fetchDafYomi(dateStr: string): Promise<string> {
  try {
    const raw = await httpsGet('https://www.sefaria.org/api/calendars');
    const data = JSON.parse(raw);
    const items = data.calendar_items || [];
    const daf = items.find((i: any) => i.title?.en === 'Daf Yomi');
    return daf ? (daf.displayValue?.he || daf.displayValue?.en || '---') : '---';
  } catch {
    return '---';
  }
}

async function fetchHebcalEvents(dateStr: string, endDateStr: string, geonameid: number): Promise<{
  parasha: string | null;
  omer: string | null;
  candleLighting: string | null;
  havdalah: string | null;
}> {
  try {
    const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on` +
      `&year=now&month=now&ss=on&mf=on&c=on&geo=geoname&geonameid=${geonameid}` +
      `&M=on&s=on&o=on&b=20&start=${dateStr}&end=${endDateStr}&lg=he`;
    const raw = await httpsGet(url);
    const data = JSON.parse(raw);
    const items = data.items || [];

    const parashaItem = items.find((i: any) => i.category === 'parashat');
    const holiday = items.find((i: any) => i.category === 'holiday' && i.subcat === 'major');
    const candles = items.find((i: any) => i.category === 'candles');
    const havdalahItem = items.find((i: any) => i.category === 'havdalah');
    const omerItem = items.find((i: any) => i.category === 'omer' && i.date === dateStr);

    let parasha: string | null = null;
    if (parashaItem) parasha = parashaItem.hebrew || parashaItem.title;
    else if (holiday) parasha = holiday.hebrew || holiday.title;

    return {
      parasha,
      omer: omerItem ? (omerItem.hebrew || omerItem.title) : null,
      candleLighting: candles ? fmtTime(candles.date) : null,
      havdalah: havdalahItem ? fmtTime(havdalahItem.date) : null,
    };
  } catch {
    return { parasha: null, omer: null, candleLighting: null, havdalah: null };
  }
}

async function generateYear(year: number, geonameid: number): Promise<YearCache> {
  const cache: YearCache = { geonameid, year, days: {} };

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = fmtDate(d);
    const endD = new Date(d);
    endD.setDate(endD.getDate() + 7);
    const endDateStr = fmtDate(endD);

    console.log(`  Fetching ${dateStr}...`);

    const [hebrewDate, zmanim, events, dafYomi] = await Promise.all([
      fetchHebrewDate(dateStr),
      fetchZmanim(dateStr, geonameid),
      fetchHebcalEvents(dateStr, endDateStr, geonameid),
      fetchDafYomi(dateStr),
    ]);

    cache.days[dateStr] = {
      hebrewDate,
      zmanim,
      ...events,
      dafYomi,
    };

    await delay(200); // Rate limiting
  }

  return cache;
}

async function main(): Promise<void> {
  const { startYear, endYear, geonameid, force, prebuild } = parseArgs();

  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  console.log(`Generating cache for years ${startYear}-${endYear}, geonameid=${geonameid}`);

  for (let year = startYear; year <= endYear; year++) {
    const filePath = path.join(CACHE_DIR, `${year}.json`);

    if (!force && fs.existsSync(filePath)) {
      console.log(`Skipping ${year} — file already exists. Use --force to regenerate.`);
      continue;
    }

    console.log(`Generating ${year}...`);
    const cache = await generateYear(year, geonameid);
    fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf-8');
    console.log(`Saved ${filePath}`);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Update package.json scripts**

Ensure the scripts in `package.json` use the tsconfig:

```json
"prebuild": "ts-node --project tsconfig.scripts.json scripts/generate-cache.ts --prebuild",
"generate-cache": "ts-node --project tsconfig.scripts.json scripts/generate-cache.ts"
```

- [ ] **Step 4: Test script with a small range**

```bash
npm run generate-cache -- --years 2026-2026 --geonameid 281184
```

Expected: Creates `src/assets/cache/2026.json` with data for every day in 2026.

- [ ] **Step 5: Verify generated file format**

```bash
head -30 src/assets/cache/2026.json
```

Expected: JSON with `geonameid`, `year`, and `days` object containing date keys with `hebrewDate`, `zmanim`, `parasha`, `omer`, `candleLighting`, `havdalah`, `dafYomi`.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-cache.ts tsconfig.scripts.json package.json
git commit -m "feat: add cache generation script for yearly hebcal data"
```

---

### Task 4: Cache Service

**Files:**
- Create: `src/app/services/cache.service.ts`

- [ ] **Step 1: Create CacheService**

Create `src/app/services/cache.service.ts`:

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/app/services/cache.service.ts
git commit -m "feat: add CacheService for loading yearly JSON cache files"
```

---

### Task 5: Local Compute Service

**Files:**
- Create: `src/app/services/local-compute.service.ts`

- [ ] **Step 1: Create LocalComputeService**

Create `src/app/services/local-compute.service.ts`:

```typescript
import { Injectable } from '@angular/core';
import { HDate, Zmanim, HebrewCalendar, Location, flags, DafYomi } from '@hebcal/core';

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
    const zmanim = new Zmanim(date, latitude, longitude);

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
      if (val) {
        zmanimMap[key] = val.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
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
        const eventTime = ev.eventTime;
        if (eventTime) {
          candleLighting = eventTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
      if (mask & flags.LIGHT_CANDLES_TZEIS) {
        const eventTime = ev.eventTime;
        if (eventTime) {
          havdalah = eventTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        }
      }
    }

    // Daf Yomi
    let dafYomi = '---';
    try {
      const daf = new DafYomi(hd);
      dafYomi = daf.render('he');
    } catch {
      dafYomi = '---';
    }

    return { hebrewDate, zmanim: zmanimMap, parasha, omer, candleLighting, havdalah, dafYomi };
  }

  private fmtDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/services/local-compute.service.ts
git commit -m "feat: add LocalComputeService for offline hebcal computation"
```

---

### Task 6: Refactor HebcalService with 3-Tier Fallback

**Files:**
- Modify: `src/app/services/hebcal.service.ts`

- [ ] **Step 1: Rewrite HebcalService**

Replace the contents of `src/app/services/hebcal.service.ts` with:

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError, switchMap } from 'rxjs';
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

// Jerusalem defaults for local compute fallback
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

  private getLocalData() {
    const now = new Date();
    return this.localCompute.computeDay(now, DEFAULT_LAT, DEFAULT_LON, DEFAULT_TZID);
  }

  fetchHebrewDate(): Observable<{ hebrew?: string }> {
    const date = this.fmtDate(new Date());
    return this.http
      .get<{ hebrew?: string }>(`https://www.hebcal.com/converter?cfg=json&date=${date}&g2h=1&strict=1`)
      .pipe(
        catchError(() =>
          this.cache.getDayData(date).pipe(
            switchMap((cached) => {
              if (cached) return of({ hebrew: cached.hebrewDate });
              const local = this.getLocalData();
              return of({ hebrew: local.hebrewDate });
            }),
          ),
        ),
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
            const items = Object.entries(ZMAN_LABELS)
              .filter(([key]) => t[key])
              .map(([key, label]) => ({ label, value: this.fmtTime(t[key]) }));
            subscriber.next(items);
            subscriber.complete();
          },
          error: () => {
            // Tier 2: JSON cache
            this.cache.getDayData(date).subscribe({
              next: (cached) => {
                if (cached && Object.keys(cached.zmanim).length > 0) {
                  const items = Object.entries(ZMAN_LABELS)
                    .filter(([key]) => cached.zmanim[key])
                    .map(([key, label]) => ({ label, value: cached.zmanim[key] }));
                  subscriber.next(items);
                  subscriber.complete();
                } else {
                  // Tier 3: local compute
                  const local = this.getLocalData();
                  const items = Object.entries(ZMAN_LABELS)
                    .filter(([key]) => local.zmanim[key])
                    .map(([key, label]) => ({ label, value: local.zmanim[key] }));
                  subscriber.next(items);
                  subscriber.complete();
                }
              },
              error: () => {
                const local = this.getLocalData();
                const items = Object.entries(ZMAN_LABELS)
                  .filter(([key]) => local.zmanim[key])
                  .map(([key, label]) => ({ label, value: local.zmanim[key] }));
                subscriber.next(items);
                subscriber.complete();
              },
            });
          },
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
            if (parasha) parashaName = parasha.hebrew || parasha.title;
            else if (holiday) parashaName = holiday.hebrew || holiday.title;

            subscriber.next({
              parashaName,
              showOmer: !!omer,
              omerCount: omer ? (omer.hebrew || omer.title) : '',
              candleLighting: candles ? this.fmtTime(candles.date) : '',
              havdalah: havdalahItem ? this.fmtTime(havdalahItem.date) : '',
            });
            subscriber.complete();
          },
          error: () => {
            // Tier 2: JSON cache
            this.cache.getDayData(start).subscribe({
              next: (cached) => {
                if (cached) {
                  subscriber.next({
                    parashaName: cached.parasha || '---',
                    showOmer: !!cached.omer,
                    omerCount: cached.omer || '',
                    candleLighting: cached.candleLighting || '',
                    havdalah: cached.havdalah || '',
                  });
                  subscriber.complete();
                } else {
                  // Tier 3: local compute
                  const local = this.getLocalData();
                  subscriber.next({
                    parashaName: local.parasha || '---',
                    showOmer: !!local.omer,
                    omerCount: local.omer || '',
                    candleLighting: local.candleLighting || '',
                    havdalah: local.havdalah || '',
                  });
                  subscriber.complete();
                }
              },
              error: () => {
                const local = this.getLocalData();
                subscriber.next({
                  parashaName: local.parasha || '---',
                  showOmer: !!local.omer,
                  omerCount: local.omer || '',
                  candleLighting: local.candleLighting || '',
                  havdalah: local.havdalah || '',
                });
                subscriber.complete();
              },
            });
          },
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
          error: () => {
            const date = this.fmtDate(new Date());
            // Tier 2: JSON cache
            this.cache.getDayData(date).subscribe({
              next: (cached) => {
                if (cached && cached.dafYomi !== '---') {
                  subscriber.next(cached.dafYomi);
                  subscriber.complete();
                } else {
                  // Tier 3: local compute
                  const local = this.getLocalData();
                  subscriber.next(local.dafYomi);
                  subscriber.complete();
                }
              },
              error: () => {
                const local = this.getLocalData();
                subscriber.next(local.dafYomi);
                subscriber.complete();
              },
            });
          },
        });
    });
  }

  getSeasonPrayer(): { wind: string; rain: string } {
    const m = new Date().getMonth();
    if (m >= 3 && m <= 9) return { wind: 'מוריד הטל', rain: 'ותן ברכה' };
    return { wind: 'משיב הרוח ומוריד הגשם', rain: 'ברך עלינו' };
  }
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/services/hebcal.service.ts
git commit -m "feat: refactor HebcalService with 3-tier fallback (API -> cache -> local)"
```

---

### Task 7: PWA Setup

**Files:**
- Create: `src/manifest.webmanifest`
- Create: `ngsw-config.json`
- Create: `src/assets/icons/icon-192x192.png`
- Create: `src/assets/icons/icon-512x512.png`
- Modify: `src/app/app.config.ts`
- Modify: `src/index.html`
- Modify: `angular.json`

- [ ] **Step 1: Create PWA icons**

Generate simple placeholder icons (black background with white text). These can be replaced later with proper icons.

```bash
mkdir -p src/assets/icons
```

Use a simple tool or create minimal PNG icons. For now, create placeholder 1x1 PNGs that can be replaced:

```bash
npx --yes create-pwa-icons --input src/assets/icons/icon.svg 2>/dev/null || echo "Create icons manually"
```

If the above doesn't work, create minimal placeholder icons manually. The icons need to be valid PNG files at 192x192 and 512x512 pixels.

- [ ] **Step 2: Create manifest.webmanifest**

Create `src/manifest.webmanifest`:

```json
{
  "name": "לוח בית כנסת",
  "short_name": "לוח ביכ״נ",
  "dir": "rtl",
  "lang": "he",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "assets/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "assets/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

- [ ] **Step 3: Create ngsw-config.json**

Create `ngsw-config.json` at project root:

```json
{
  "$schema": "./node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "fonts",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/assets/fonts/*.woff2"
        ]
      }
    },
    {
      "name": "cache",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/assets/cache/*.json"
        ]
      }
    },
    {
      "name": "icons",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/assets/icons/*.png"
        ]
      }
    }
  ]
}
```

- [ ] **Step 4: Add manifest link and theme-color to index.html**

In `src/index.html`, add inside `<head>` (after the `<title>` tag):

```html
  <link rel="manifest" href="manifest.webmanifest">
  <meta name="theme-color" content="#000000">
```

- [ ] **Step 5: Register ServiceWorker in app.config.ts**

Update `src/app/app.config.ts`:

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

- [ ] **Step 6: Update angular.json to include manifest and service worker**

In `angular.json`, in `projects.synagogue-board.architect.build.options`:

Add `"serviceWorker": "ngsw-config.json"` at the same level as `"browser"`.

In the `assets` array, add the manifest:

```json
{
  "glob": "manifest.webmanifest",
  "input": "src",
  "output": "/"
}
```

Make sure the assets array also includes the `src/assets` entry from Task 2.

- [ ] **Step 7: Build and verify**

```bash
npm run build
```

Expected: Build succeeds. `dist/synagogue-board/browser/` should contain `ngsw-worker.js`, `ngsw.json`, and `manifest.webmanifest`.

```bash
ls dist/synagogue-board/browser/ngsw-worker.js dist/synagogue-board/browser/manifest.webmanifest
```

- [ ] **Step 8: Commit**

```bash
git add src/manifest.webmanifest ngsw-config.json src/app/app.config.ts src/index.html angular.json src/assets/icons/
git commit -m "feat: add PWA support with Service Worker and Web App Manifest"
```

---

### Task 8: Final Integration Test

- [ ] **Step 1: Full build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Serve production build and test offline**

```bash
npx http-server dist/synagogue-board/browser -p 8080
```

Open `http://localhost:8080` in Chrome. Verify:
1. Board displays correctly with local fonts
2. Open DevTools > Application > Service Workers — SW is registered
3. Open DevTools > Application > Manifest — manifest is loaded
4. Go to DevTools > Network > check "Offline" — reload the page — board still loads and shows data from cache/local compute

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "feat: complete offline PWA support"
```
