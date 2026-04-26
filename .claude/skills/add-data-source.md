---
name: add-data-source
description: Add a new data field to the board following the 3-tier fallback pattern
---

When adding a new data source to the board:

1. **HebcalService** (`src/app/services/hebcal.service.ts`):
   - Add a new `fetch*()` method returning `Observable<T>`
   - Implement 3-tier fallback: API call -> `this.cache.getDayData()` -> `this.localCompute.computeDay()`
   - Use `catchError` + `switchMap` for each fallback level
   - Use `this.fmtTime()` / `this.fmtDate()` helpers for formatting

2. **CacheService** (`src/app/services/cache.service.ts`):
   - Add the new field to the cached day data interface
   - Update `getDayData()` return type if needed

3. **LocalComputeService** (`src/app/services/local-compute.service.ts`):
   - Add offline computation for the new field using `@hebcal/core` or `@hebcal/learning`
   - Use Jerusalem defaults: lat 31.7683, lon 35.2137, tzid Asia/Jerusalem

4. **Cache generation** (`scripts/generate-cache.ts`):
   - Add the new field to the generated JSON structure

5. **App component** (`src/app/app.ts`):
   - Add `signal()` for the new data
   - Subscribe in `loadAll()` with `next`/`error` handlers
   - Display `'טוען...'` while loading, `'---'` on error

6. **Display component**:
   - Accept the data via `input.required<T>()`
   - Wire font sizes through `ConfigService` if needed

7. **Tests**: Update specs for all modified files
