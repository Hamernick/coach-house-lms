# My-Organization Bento Rules
Status: Active
Owner: Caleb + Codex
Updated: 2026-02-06

## Grid Contract
- Base: `1` column.
- `md`: `2` columns.
- `xl`: `12` columns.
- Row sizing: `xl:auto-rows-[minmax(210px,1fr)]`.
- Stretch rule: each card must include `h-full` and explicit `min-h-*`.

## Card Rules
- `profile`:
  class: `h-full min-h-[340px] md:min-h-[360px] xl:col-span-4 xl:row-span-2`
  rule: summary-first card with bottom-anchored primary action.
- `activity`:
  class: `h-full min-h-[340px] md:min-h-[360px] xl:col-span-4 xl:row-span-2`
  rule: scroll-safe feed density; compact badge states.
- `calendar`:
  class: `h-full min-h-[280px] xl:col-span-4`
  rule: event preview + dual controls (`open` / `add`).
- `launchRoadmap`:
  class: `h-full min-h-[280px] xl:col-span-4`
  rule: temporary formation card; hide when preview modules complete.
- `programBuilder`:
  class: `h-full min-h-[420px] xl:col-span-12`
  rule: full-width core workspace panel.
- `team`:
  class: `h-full min-h-[300px] xl:col-span-7`
  rule: compact roster with management CTA.
- `workspaceActions`:
  class: `h-full min-h-[300px] xl:col-span-5`
  rule: high-frequency launch shortcuts only.

## Source of Truth
- `src/components/organization/my-organization-bento-rules.ts`
- `src/app/(dashboard)/my-organization/page.tsx`
