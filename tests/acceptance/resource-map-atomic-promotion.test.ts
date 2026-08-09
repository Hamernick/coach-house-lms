import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()
const MIGRATION = readFileSync(
  join(
    ROOT,
    "supabase/migrations/20260714201500_resource_map_atomic_promotion.sql"
  ),
  "utf8"
)
const SCRIPT = readFileSync(
  join(ROOT, "scripts/resource-map/promote-approved-records.mjs"),
  "utf8"
)
const FUNCTIONS = readFileSync(
  join(ROOT, "src/lib/supabase/schema/functions.ts"),
  "utf8"
)

describe("resource map atomic promotion", () => {
  it("serializes promotion and accepted duplicate decisions", () => {
    expect(MIGRATION).toContain(
      "create or replace function public.promote_resource_map_import_record"
    )
    expect(MIGRATION).toContain("for update;")
    expect(MIGRATION).toContain("lock_resource_map_match_acceptance")
    expect(MIGRATION).toContain(
      "resource_map_import_record_matches_accepted_idx"
    )
    expect(MIGRATION).toContain("where match_status = 'accepted'")

    const duplicateCheck = MIGRATION.indexOf(
      "and match.match_status = 'accepted'"
    )
    const organizationInsert = MIGRATION.indexOf(
      "insert into public.resource_map_organizations"
    )
    expect(duplicateCheck).toBeGreaterThan(0)
    expect(duplicateCheck).toBeLessThan(organizationInsert)
  })

  it("requires human approval and completed source verification", () => {
    expect(MIGRATION).toContain("v_record.review_status <> 'approved'")
    expect(MIGRATION).toContain("v_record.reviewed_by is null")
    expect(MIGRATION).toContain("v_record.reviewed_at is null")
    expect(MIGRATION).toContain("from public.profiles reviewer")
    expect(MIGRATION).toContain("v_record.last_verified_at is null")
    expect(MIGRATION).toContain("sourceComparisonCount")
    expect(MIGRATION).toContain("unsupportedClaims")
    expect(MIGRATION).toContain("contradictions")
    expect(MIGRATION).toContain("public.resource_map_enrichment_runs")
    expect(MIGRATION).toContain("enrichment_run.pass_type = 'verification'")
    expect(MIGRATION).toContain("enrichment_run.status = 'completed'")
  })

  it("keeps the transaction private, idempotent, and evidence preserving", () => {
    expect(MIGRATION).toContain("security invoker")
    expect(MIGRATION).not.toContain("security definer")
    expect(MIGRATION).toContain("to authenticated, service_role")
    expect(MIGRATION).toContain("'already_promoted'::text")
    expect(MIGRATION).toContain(
      "insert into public.resource_map_field_evidence"
    )
    expect(MIGRATION).toContain("'promotedFromImport', true")
    expect(MIGRATION).toContain(
      "insert into public.resource_map_curation_events"
    )
    expect(MIGRATION).toContain("v_record.reviewed_by")
    expect(MIGRATION).toContain("v_record.last_verified_at")

    const contactInsert = MIGRATION.indexOf(
      "insert into public.resource_map_contacts"
    )
    const linkInsert = MIGRATION.indexOf(
      "insert into public.resource_map_links"
    )
    expect(MIGRATION.slice(contactInsert, linkInsert)).toContain(
      "is_public,\n      metadata"
    )
    expect(MIGRATION.slice(contactInsert, linkInsert)).toContain(
      "coalesce((v_contact ->> 'is_primary')::boolean, false),\n      false,"
    )
    expect(MIGRATION.slice(linkInsert)).toContain(
      "coalesce((v_link ->> 'is_primary')::boolean, false),\n      false,"
    )
  })

  it("uses one RPC call instead of client-side multi-write promotion", () => {
    expect(SCRIPT).toContain('"promote_resource_map_import_record"')
    expect(SCRIPT).toContain("p_import_record_id: record.id")
    expect(SCRIPT).toContain("p_payload: payload")
    expect(SCRIPT).toContain("p_publish: publish")
    expect(SCRIPT).not.toContain('.from("resource_map_organizations")')
    expect(SCRIPT).not.toContain('.from("resource_map_services")')
    expect(SCRIPT).not.toContain("insertPromotionChildren")
    expect(FUNCTIONS).toContain("promote_resource_map_import_record")
  })
})
