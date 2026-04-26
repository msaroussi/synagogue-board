# CLAUDE.md

## Project Overview

A synagogue LED board display — an Angular 21 app showing Hebrew date, zmanim, parasha, daf yomi, candle lighting, havdalah, and a real-time clock. Designed for Google TV or any screen. All text is Hebrew (RTL). Deployed to GitHub Pages via CI/CD.

## Tech Stack

- **Framework:** Angular 21 (standalone components, signals, `inject()`)
- **Language:** TypeScript 5.9 (strict mode)
- **Reactive:** RxJS 7.8 (Observables for HTTP, signals for UI state)
- **Offline compute:** `@hebcal/core` + `@hebcal/learning`
- **PWA:** `@angular/service-worker`
- **Testing:** Jest 30 + jest-preset-angular (jsdom) + ts-jest (node)
- **Linting:** ESLint 10 + angular-eslint + typescript-eslint
- **CI:** GitHub Actions (Node 22) — lint, test, build, deploy to GitHub Pages
- **Fonts:** Self-hosted Heebo (variable) + Secular One (woff2)

## Commands

```bash
npm start          # Dev server (ng serve)
npm run build      # Production build (runs prebuild first to generate cache)
npm test           # Run all tests (Jest)
npx jest path/to/file.spec.ts  # Run single test file
npx jest scripts/  # Run only scripts tests
npm run lint       # ESLint

# Cache generation (requires internet)
npm run generate-cache -- --years 2026-2035 --geonameid 281184
npm run generate-cache -- --years 2026-2026 --geonameid 281184 --force  # Regenerate existing
```

## Project Structure

```
src/
  app/
    app.ts / app.html / app.css       # Root component — orchestrates data loading
    app.config.json                    # Static defaults (geonameid, city, fonts, dimensions)
    app.config.ts                      # Angular app config (providers, etc.)
    components/
      clock/                           # Real-time clock with Hebrew day name
      config-panel/                    # Runtime config UI (font sizes, split view, geonameid)
      daily-info/                      # Parasha, omer, season prayer, daf yomi
      shabbat-info/                    # Candle lighting + havdalah times
      top-row/                         # Hebrew date, dedication, gregorian date
      zmanim-bar/                      # Daily zmanim list
    services/
      hebcal.service.ts                # Main data service — 3-tier fallback chain
      cache.service.ts                 # Loads pre-generated assets/cache/YYYY.json
      config.service.ts                # Runtime config persisted in localStorage
      local-compute.service.ts         # Offline compute via @hebcal/core + @hebcal/learning
  assets/
    cache/                             # Pre-generated yearly JSON data files
    fonts/                             # Self-hosted woff2 font files
    icons/                             # PWA icons + config gear SVG
scripts/
  generate-cache.ts                    # Cache generation script (own tsconfig)
  generate-cache.spec.ts
.github/workflows/
  ci.yml                               # Lint + test + build
  deploy.yml                           # Deploy to GitHub Pages on CI success
```

## Code Conventions

### Naming
- **Components:** PascalCase class names without suffix (e.g., `Clock`, `DailyInfo`, `App` — not `ClockComponent`)
- **Services:** PascalCase with `Service` suffix (`HebcalService`, `ConfigService`)
- **Files:** kebab-case (`daily-info.ts`, `config.service.ts`)
- **Component selectors:** `app-` prefix, kebab-case (`app-clock`, `app-daily-info`)
- **Directive selectors:** `app` prefix, camelCase (enforced by ESLint)

### Angular Patterns
- **Standalone components** — no NgModules. Components declare `imports` in `@Component` decorator
- **Signals** for all component state (`signal()`, `computed()`, `input.required<T>()`)
- **`inject()`** for DI — no constructor injection
- **`takeUntilDestroyed()`** for subscription cleanup in constructors
- **`setInterval`** managed manually in `ngOnInit`/`ngOnDestroy` (not RxJS timers)

### Async / Data Patterns
- **HTTP calls** return `Observable` via Angular `HttpClient`
- **Fallback chain:** `catchError` + `switchMap` — API -> CacheService -> LocalComputeService
- **Config changes** trigger reload via RxJS `Subject` (`reload$`)
- **No async/await** in the Angular app — everything is Observable-based
- **Error display:** set signal to `'---'` on error, `'טוען...'` as loading placeholder

### Style
- **RTL layout** — all text is Hebrew
- **CSS files** per component (no inline styles)
- **Template files** per component (no inline templates)
- **2-space indentation** in TypeScript
- **Single quotes** for strings
- **Trailing commas** in multi-line arrays/objects

## Architecture

### Data Flow — 3-Tier Fallback

`HebcalService` provides all calendar data through a fallback chain:
1. **API** — hebcal.com + sefaria.org (live)
2. **CacheService** — loads pre-generated `assets/cache/YYYY.json` files
3. **LocalComputeService** — computes with `@hebcal/core` + `@hebcal/learning` (fully offline)

Each method (`fetchHebrewDate`, `fetchZmanim`, `fetchParashaAndShabbat`, `fetchDafYomi`) independently follows this chain via `catchError`/`switchMap`.

### PWA

Full offline PWA with `@angular/service-worker`. Config in `ngsw-config.json`. App shell and fonts are prefetched; cache JSON files are lazy-loaded.

### Configuration

`src/app/app.config.json` — static defaults (geonameid, city, fonts, dimensions).
`ConfigService` — runtime config persisted in localStorage, supports live font size adjustment, split view, and geonameid changes (triggers data reload via `reload$` Subject).

### Local Compute Defaults

When falling back to `@hebcal/core`, hardcoded to Jerusalem coordinates (31.7683, 35.2137, Asia/Jerusalem). These are in `hebcal.service.ts`.

## Testing Conventions

### Setup
Two Jest projects configured in `jest.config.ts`:
- **angular** — `src/**/*.spec.ts` using jest-preset-angular (jsdom)
- **scripts** — `scripts/**/*.spec.ts` using ts-jest (node environment)

`@hebcal/*` packages are ESM-only — handled via `moduleNameMapper` and `transformIgnorePatterns` in jest config.

### Patterns
- **`TestBed.configureTestingModule`** with `imports: [Component, HttpClientTestingModule]`
- **`HttpTestingController`** to mock HTTP — flush pending requests in helper functions
- **`fakeAsync` + `tick` + `discardPeriodicTasks`** for timer-based tests
- **`localStorage.clear()`** in `beforeEach` to isolate config tests
- **Spec files** co-located with source files (`*.spec.ts` next to `*.ts`)
- **Coverage** collected from `src/app/**/*.ts`, excluding config and main entry

### Key Directories

- `scripts/` — cache generation script (`generate-cache.ts`) with its own `tsconfig.scripts.json`
- `src/assets/fonts/` — self-hosted Heebo (variable) + Secular One woff2 files
- `src/assets/cache/` — pre-generated yearly JSON data files
