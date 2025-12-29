# Performance and Sync Plan

Goal: keep the app fast (low latency, fast render) and keep UI in sync with the database after writes.

## Done (latest session)
- Parallelized dashboard data fetches to cut serial Supabase latency.
- Reused Supabase client and parallelized module content/assignment/submission queries.
- Fixed hydration drift from SSR randomness (sidebar skeleton width) and client-only time formatting (assignment last-saved).

## Next tasks (priority)
1) Dashboard: consolidate `fetchNextAction` into a single RPC that returns class slug + module in one call.
2) Dashboard: replace `fetchAcceleratorProgress` full module scan with a view or RPC (count only).
3) Auth fetches: add a cached server helper (user + profile) to avoid duplicate queries across layout + pages.
4) Module progress sync: revalidate `/dashboard` and `/training` after assignment submissions so progress cards update immediately.
5) Public pages: use ISR + `revalidate` tags for `/[org]` and `/[org]/roadmap` to keep public views fresh.
6) Community map: ensure token loading is client-safe and use `dynamic` import + `ssr: false` for Mapbox to reduce hydration cost.
7) Roadmap data: consider removing per-section `isPublic` in favor of a single org-level toggle (data cleanup + migration).

## Guardrails
- No `Date.now()` / `Math.random()` in SSR output.
- Keep authed pages `no-store`, public pages ISR with revalidate.
- Prefer server actions returning updated rows and update local state directly.
- Use `revalidatePath` or `revalidateTag` after any write that changes a server-rendered view.

## Metrics to watch
- TTFB on `/dashboard` and `/class/[slug]/module/[index]`.
- RSC payload size and hydration time on heavy pages (roadmap, module).
- Supabase query count per page (goal: minimize serial chains).

## Files to revisit
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/lib/modules/service.ts`
- `src/app/(dashboard)/class/[slug]/module/[index]/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/api/modules/[id]/assignment-submission/route.ts`
