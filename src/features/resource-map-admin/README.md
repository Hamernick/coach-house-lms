# Resource Map Admin Feature

## Ownership

- Pure validation and state helpers: `src/features/resource-map-admin/lib/**`
- Admin server actions and loaders: `src/features/resource-map-admin/server/**`
- Visible super-admin curation surface: `/find` profile hide/delete buttons only.
- No standalone `/admin/platform/resource-map` review UI is currently exposed.
- Acceptance coverage: `tests/acceptance/resource-map-admin.test.ts`

## Safety Rules

- Call `requireAdmin()` before any resource-map admin mutation or review loader.
- Use service-role writes only after platform-admin auth is verified.
- Local scraped-data preview can render on `/find` through `RESOURCE_MAP_LOCAL_PREVIEW_FILE` without Supabase upload.
- Production `/find` data comes from promoted canonical records, not raw import records.
- Contacts and links stay private until explicit visibility actions mark them public.
- Hide/suppress/delete flows must insert `resource_map_curation_events`.
- Platform organization profile hide/delete must insert `public_map_organization_curation_events`.
- Canonical public-field edits must insert `resource_map_curation_events`.
- Contact/link visibility must be approved or revoked explicitly through audited admin actions.
- Promotion marks approved imports as canonical records; default promotion scripts create non-public draft records unless `--publish` is explicitly passed.
- Promotion can carry category, location, contact, and link data into canonical review tables, but promoted contacts and links stay private until explicit visibility approval.
- Promotion blocks approved imports with accepted duplicate matches instead of creating duplicate canonical resources.
- Do not add a manual review page unless product scope changes; keep visible admin-only controls on the public profile surface.

## Tooling

Local scrape/search dump path: `data/resource-map/*.jsonl`

- `pnpm resource-map:schema-status -- --strict`
- `pnpm resource-map:schema-setup-sql`
- `pnpm resource-map:public-read-sql`
- `pnpm data:discover -- --location "Chicago, IL" --categories food,health --write`
- `pnpm data:ingest -- --source <sourceId> --write`
- `pnpm data:ingest -- --all --write`
- `pnpm data:ingest -- --type <connectorType> --write`
- `RESOURCE_MAP_LOCAL_PREVIEW_FILE=./data/resource-map/scraped.jsonl pnpm dev`
- `pnpm resource-map:validate-local -- --input ./data/resource-map/scraped.jsonl`
- `pnpm resource-map:source-search-plan -- --location "Chicago, IL" --categories food,health --pretty`
- `pnpm resource-map:discover-sources -- --input sources.jsonl --apply`
- `pnpm resource-map:import -- --input records.jsonl --source-slug <slug> --source-name <name>`
- `pnpm resource-map:match -- --apply`
- `pnpm resource-map:review-matches -- --id <uuid> --status accepted --reason "Same provider" --apply`
- `pnpm resource-map:review-imports -- --id <uuid> --status approved --reason "Reviewed source evidence" --apply`
- `pnpm resource-map:promote -- --apply`
- `pnpm resource-map:source-freshness -- --stale-days 90`

Apply the migration to the target Supabase project, then run the read-only schema status check. If the status check reports missing `geo_point`, the sanitized public view/RPC, `public_map_organization_curation_events`, availability columns, taxonomy rows, ingestion-run/raw-ingestion tables, staged quality columns, or field-evidence metadata columns, apply the relevant migrations intentionally in Supabase, or print the current connected-DB patch bundle with `resource-map:schema-setup-sql`, then re-run the strict status check. Scrape or collect data into local JSON/JSONL, validate it, preview it on `/find`, then upload the same confirmed file to Supabase staging with `resource-map:import`. After upload, use scripts/server actions for staging, dedupe, promotion, and public-field curation; the only visible super-admin controls on `/find` are profile hide/delete buttons.
