# Unused Files Archive — 2026-02-21

These files were moved out of `src/` after a conservative redundancy cleanup.

Moved files:

- `src/components/public/legacy-home-accelerator-overview-section.tsx`
- `src/components/public/legacy-home-accelerator-overview/index.ts`
- `src/components/public/legacy-home-sections.tsx`
- `src/components/public/pricing-surface-sections.tsx`
- `src/app/api/search/_lib/query-sources.ts`
- `src/hooks/lessons/wizard-reducer.ts`
- `tests/acceptance/lessons.wizard-reducer.test.ts`
- `src/app/(public)/home2/page.tsx`

Reason:

- Several files were shim wrappers that only re-exported folder modules.
- Active code now imports folder modules directly.
- No runtime behavior changes are intended.
- `src/hooks/lessons/wizard-reducer.ts` was runtime-orphaned (no `src/**` inbound references) and only used by a dedicated acceptance test; both were archived together to avoid retaining dead runtime paths solely for test coverage.
- `src/app/(public)/home2/page.tsx` was a temporary-named compatibility alias route. The public URL was removed to enforce semantic route naming and avoid exposing iteration-era route slugs.
