---
name: add-service
description: Create a new Angular injectable service following project conventions
---

When creating a new service:

1. Create file at `src/app/services/<name>.service.ts`
2. Follow project conventions:
   - `@Injectable({ providedIn: 'root' })` decorator
   - PascalCase class name with `Service` suffix
   - Use `inject()` for DI, never constructor injection
   - Return `Observable` from methods that fetch data
   - Use `signal()` for mutable state, `computed()` for derived state
   - Use `catchError`/`switchMap` for fallback chains
   - No async/await — use RxJS Observables throughout
3. Create co-located spec file `<name>.service.spec.ts`
4. Test with `TestBed.configureTestingModule({ imports: [HttpClientTestingModule] })`
5. Use `HttpTestingController` to mock HTTP requests
