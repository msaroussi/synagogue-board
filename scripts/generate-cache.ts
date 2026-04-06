import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ────────────────────────────────────────────────────────────────────

interface DayCache {
  hebrewDate: string;
  zmanim: {
    alotHaShachar: string;
    sunrise: string;
    sofZmanShmaMGA: string;
    sofZmanShma: string;
    sofZmanTfilla: string;
    chatzot: string;
    minchaGedola: string;
    minchaKetana: string;
    plagHaMincha: string;
    sunset: string;
    tzeit: string;
  };
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

interface ParsedArgs {
  years: number[];
  geonameid: number;
  force: boolean;
  prebuild: boolean;
}

interface AppConfig {
  geonameid: number;
  [key: string]: unknown;
}

// ── HTTP helper ───────────────────────────────────────────────────────────────

export function fetchJson(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e}`));
        }
      });
    }).on('error', reject);
  });
}

// ── Argument parsing ──────────────────────────────────────────────────────────

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let years: number[] = [];
  let geonameid = 281184;
  let force = false;
  let prebuild = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--years' && args[i + 1]) {
      const range = args[++i];
      years = parseYearRange(range);
    } else if (args[i] === '--geonameid' && args[i + 1]) {
      geonameid = parseInt(args[++i], 10);
    } else if (args[i] === '--force') {
      force = true;
    } else if (args[i] === '--prebuild') {
      prebuild = true;
    }
  }

  if (prebuild && years.length === 0) {
    const currentYear = new Date().getFullYear();
    years = Array.from({ length: 11 }, (_, i) => currentYear + i);
  }

  if (!prebuild && years.length === 0) {
    const currentYear = new Date().getFullYear();
    years = [currentYear];
  }

  return { years, geonameid, force, prebuild };
}

export function parseYearRange(range: string): number[] {
  const parts = range.split('-');
  if (parts.length === 2) {
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[1], 10);
    if (!isNaN(start) && !isNaN(end) && end >= start) {
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
  }
  const single = parseInt(range, 10);
  if (!isNaN(single)) return [single];
  throw new Error(`Invalid year range: ${range}`);
}

// ── Date utilities ────────────────────────────────────────────────────────────

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTime(isoString: string | undefined | null): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jerusalem',
    });
  } catch {
    return '';
  }
}

export function getDaysInYear(year: number): Date[] {
  const days: Date[] = [];
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

// ── API fetchers ──────────────────────────────────────────────────────────────

export async function fetchHebrewDate(dateStr: string): Promise<string> {
  const url = `https://www.hebcal.com/converter?cfg=json&date=${dateStr}&g2h=1&strict=1`;
  const data = await fetchJson(url) as Record<string, unknown>;
  const hebrew = data['hebrew'] as string | undefined;
  return hebrew ?? '';
}

export async function fetchZmanim(dateStr: string, geonameid: number): Promise<DayCache['zmanim']> {
  const url = `https://www.hebcal.com/zmanim?cfg=json&date=${dateStr}&geonameid=${geonameid}`;
  const data = await fetchJson(url) as Record<string, unknown>;
  const times = (data['times'] ?? {}) as Record<string, string>;

  return {
    alotHaShachar: formatTime(times['alotHaShachar']),
    sunrise: formatTime(times['sunrise']),
    sofZmanShmaMGA: formatTime(times['sofZmanShmaMGA']),
    sofZmanShma: formatTime(times['sofZmanShmaGRA']),
    sofZmanTfilla: formatTime(times['sofZmanTfillaGRA']),
    chatzot: formatTime(times['chatzot']),
    minchaGedola: formatTime(times['minchaGedola']),
    minchaKetana: formatTime(times['minchaKetana']),
    plagHaMincha: formatTime(times['plagHaMincha']),
    sunset: formatTime(times['sunset']),
    tzeit: formatTime(times['tzeit85deg']),
  };
}

export async function fetchHebcalEvents(
  dateStr: string,
  geonameid: number
): Promise<{ parasha: string | null; omer: string | null; candleLighting: string | null; havdalah: string | null; dafYomi: string }> {
  const endDate = getDatePlusDays(dateStr, 7);
  const url =
    `https://www.hebcal.com/hebcal?v=1&cfg=json&maj=on&min=on&mod=on&nx=on` +
    `&year=now&month=now&ss=on&mf=on&c=on&geo=geoname&geonameid=${geonameid}` +
    `&M=on&s=on&o=on&b=20&start=${dateStr}&end=${endDate}&lg=he`;
  const data = await fetchJson(url) as Record<string, unknown>;
  const items = (data['items'] ?? []) as Array<Record<string, unknown>>;

  let parasha: string | null = null;
  let omer: string | null = null;
  let candleLighting: string | null = null;
  let havdalah: string | null = null;
  let dafYomi = '';

  for (const item of items) {
    const category = item['category'] as string | undefined;
    const title = item['title'] as string | undefined;
    const itemDate = item['date'] as string | undefined;

    if (!itemDate || !itemDate.startsWith(dateStr)) continue;

    if (category === 'parashat') {
      parasha = title ?? null;
    } else if (category === 'omer') {
      omer = title ?? null;
    } else if (category === 'candles') {
      const timeStr = item['date'] as string | undefined;
      candleLighting = timeStr ? formatTime(timeStr) : null;
    } else if (category === 'havdalah') {
      const timeStr = item['date'] as string | undefined;
      havdalah = timeStr ? formatTime(timeStr) : null;
    } else if (category === 'dafyomi') {
      const heTitle = item['hebrew'] as string | undefined;
      dafYomi = heTitle ?? title ?? '';
    }
  }

  return { parasha, omer, candleLighting, havdalah, dafYomi };
}

function getDatePlusDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// ── Sleep ─────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Main generation ───────────────────────────────────────────────────────────

export async function generateYear(year: number, geonameid: number): Promise<YearCache> {
  const days = getDaysInYear(year);
  const result: YearCache = { geonameid, year, days: {} };

  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const dateStr = formatDate(day);
    process.stdout.write(`  [${i + 1}/${days.length}] ${dateStr}\r`);

    const [hebrewDate, zmanim, events] = await Promise.all([
      fetchHebrewDate(dateStr),
      fetchZmanim(dateStr, geonameid),
      fetchHebcalEvents(dateStr, geonameid),
    ]);

    result.days[dateStr] = {
      hebrewDate,
      zmanim,
      parasha: events.parasha,
      omer: events.omer,
      candleLighting: events.candleLighting,
      havdalah: events.havdalah,
      dafYomi: events.dafYomi,
    };

    if (i < days.length - 1) {
      await sleep(200);
    }
  }

  console.log(`\nDone year ${year}.`);
  return result;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args.prebuild) {
    const configPath = path.resolve(__dirname, '../src/app/app.config.json');
    if (fs.existsSync(configPath)) {
      const config: AppConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.geonameid) {
        args.geonameid = config.geonameid;
      }
    }
  }

  const cacheDir = path.resolve(__dirname, '../src/assets/cache');
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  for (const year of args.years) {
    const outputPath = path.join(cacheDir, `${year}.json`);

    if (!args.force && fs.existsSync(outputPath)) {
      console.log(`Skipping ${year} (already exists, use --force to regenerate)`);
      continue;
    }

    console.log(`Generating cache for year ${year} (geonameid=${args.geonameid})...`);
    try {
      const yearCache = await generateYear(year, args.geonameid);
      fs.writeFileSync(outputPath, JSON.stringify(yearCache, null, 2), 'utf-8');
      console.log(`Saved: ${outputPath}`);
    } catch (err) {
      console.error(`Error generating year ${year}:`, err);
    }
  }
}

// Only run if executed directly (not imported in tests)
if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
