# Offline Support Design

## Goal

Enable the synagogue LED board as a full PWA that works completely offline — installable, with cached app shell, local fonts, and a 3-tier data fallback strategy.

## Fallback Chain

Every data method in `HebcalService` follows this order:

1. **API** (hebcal.com / sefaria.org) — when online
2. **JSON cache file** (`src/assets/cache/YYYY.json`) — pre-generated per year
3. **Local computation** (`@hebcal/core`) — runtime fallback when no cache exists

## Local Fonts

Replace Google Fonts CDN links with self-hosted woff2 files:

- **Heebo** (weights: 300, 400, 500, 700, 900)
- **Secular One** (weight: 400)

Files stored in `src/assets/fonts/`. `@font-face` declarations in a global CSS file. Google Fonts `<link>` tags removed from `src/index.html`.

## JSON Cache Format

One file per year: `src/assets/cache/2026.json`

```json
{
  "geonameid": 281184,
  "year": 2026,
  "days": {
    "2026-01-01": {
      "hebrewDate": "...",
      "zmanim": {
        "alotHaShachar": "HH:MM",
        "sunrise": "HH:MM",
        "sofZmanShmaMGA": "HH:MM",
        "sofZmanShma": "HH:MM",
        "sofZmanTfilla": "HH:MM",
        "chatzot": "HH:MM",
        "minchaGedola": "HH:MM",
        "minchaKetana": "HH:MM",
        "plagHaMincha": "HH:MM",
        "sunset": "HH:MM",
        "tzeit": "HH:MM"
      },
      "parasha": "string | null",
      "omer": "string | null",
      "candleLighting": "HH:MM | null",
      "havdalah": "HH:MM | null",
      "dafYomi": "string"
    }
  }
}
```

- Times are pre-formatted as `HH:MM` (not ISO)
- `parasha`, `omer`, `candleLighting`, `havdalah` are `null` when not applicable
- `geonameid` at root level to verify cache matches configured city

## Cache Generation Script

### Location

`scripts/generate-cache.ts`

### Manual usage

```bash
npx ts-node scripts/generate-cache.ts --years 2026-2035 --geonameid 281184
```

Parameters:
- `--years` — range of years (e.g., `2026-2035`)
- `--geonameid` — city identifier for zmanim calculation

### Behavior

- Calls hebcal.com API and sefaria.org API for every day in the range
- Saves one JSON file per year to `src/assets/cache/`
- Includes delay between API calls to avoid rate limiting
- The `--force` flag regenerates existing files; without it, existing files are skipped

### Build integration

`prebuild` npm script runs the generator for the current year + 10 years. **Only generates files that don't already exist** — existing cache files are skipped.

## HebcalService Changes

Each method (`fetchHebrewDate`, `fetchZmanim`, `fetchParashaAndShabbat`, `fetchDafYomi`) is refactored to:

1. Try the existing API call
2. On failure: load `assets/cache/YYYY.json` via HTTP GET, look up today's date
3. On failure: compute locally using `@hebcal/core`

The service interface (method signatures and return types) remains unchanged. Callers (`App` component) require no changes.

## PWA Support

### Angular Service Worker

Use `@angular/pwa` to add full PWA support:

```bash
ng add @angular/pwa
```

This generates:
- `ngsw-config.json` — Service Worker configuration
- `src/manifest.webmanifest` — Web App Manifest
- App icons in `src/assets/icons/`

### Service Worker Caching Strategy

Configure `ngsw-config.json`:

- **App shell** (HTML, CSS, JS) — `installMode: prefetch` (cached immediately on first load)
- **Fonts** (`assets/fonts/`) — `installMode: prefetch` (cached with app shell)
- **Cache JSON files** (`assets/cache/`) — `installMode: lazy` (cached on first access)
- **API calls** — not cached by SW (handled by the fallback chain in HebcalService)

### Web App Manifest

`src/manifest.webmanifest`:

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
    { "src": "assets/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Registration

Register the Service Worker in `app.config.ts` using `provideServiceWorker()` with `enabled: environment.production`.

## New Dependencies

| Package | Type | Purpose |
|---|---|---|
| `@hebcal/core` | runtime | Tier 3 local computation fallback |
| `@angular/service-worker` | runtime | PWA Service Worker |
| `ts-node` | dev | Running generate script |

## Files Changed

| File | Change |
|---|---|
| `src/index.html` | Remove Google Fonts `<link>` tags, add manifest link |
| `src/styles.css` or new global CSS | Add `@font-face` declarations |
| `src/assets/fonts/*.woff2` | New — local font files |
| `src/assets/cache/*.json` | New — yearly cache files |
| `src/assets/icons/` | New — PWA icons (192x192, 512x512) |
| `src/manifest.webmanifest` | New — Web App Manifest |
| `ngsw-config.json` | New — Service Worker caching config |
| `src/app/app.config.ts` | Register Service Worker |
| `src/app/services/hebcal.service.ts` | Refactor to 3-tier fallback chain |
| `scripts/generate-cache.ts` | New — cache generation script |
| `package.json` | Add dependencies + `prebuild` script |
