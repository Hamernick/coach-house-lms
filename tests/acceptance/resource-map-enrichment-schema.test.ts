import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("resource map enrichment schema", () => {
  it("keeps enrichment passes private, idempotent, and auditable", () => {
    const migration = readFileSync(
      "supabase/migrations/20260714193000_resource_map_enrichment_runs.sql",
      "utf8"
    )
    const statusCheck = readFileSync(
      "scripts/resource-map/check-schema-status.mjs",
      "utf8"
    )

    expect(migration).toContain(
      "create table if not exists public.resource_map_enrichment_runs"
    )
    expect(migration).toContain("resource_map_enrichment_runs_idempotency_key")
    expect(migration).toContain("resource_map_enrichment_runs_queue_idx")
    expect(migration).toContain(
      "alter table public.resource_map_enrichment_runs force row level security"
    )
    expect(migration).toContain("to authenticated")
    expect(migration).toContain("using ((select public.is_admin()))")
    expect(migration).toContain(
      "revoke all on table public.resource_map_enrichment_runs from public, anon, authenticated"
    )
    expect(statusCheck).toContain('name: "resource_map_enrichment_runs"')
  })
})
