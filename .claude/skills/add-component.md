---
name: add-component
description: Create a new Angular standalone component following project conventions
---

When creating a new component:

1. Create directory under `src/app/components/<component-name>/`
2. Create 3 files: `<name>.ts`, `<name>.html`, `<name>.css`
3. Follow project conventions:
   - PascalCase class name WITHOUT "Component" suffix (e.g., `Clock`, `DailyInfo`)
   - Selector: `app-<kebab-case>` (e.g., `app-clock`)
   - Standalone component (no NgModules) with `imports` array in decorator
   - Use `inject()` for DI, never constructor injection
   - Use `signal()` for component state, `input.required<T>()` for inputs
   - Use `computed()` for derived values
   - Template in separate `.html` file, styles in separate `.css` file
   - Use `styleUrl` (singular) and `templateUrl`
4. Create `<name>.spec.ts` co-located with the component
5. Test uses `TestBed.configureTestingModule({ imports: [ComponentName, HttpClientTestingModule] })`
6. If the component needs config, inject `ConfigService` and expose font size computeds as readonly fields
