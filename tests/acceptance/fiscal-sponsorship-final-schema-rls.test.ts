import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("fiscal sponsorship final-schema RLS", () => {
  const publicationMigration = readSource(
    "supabase/migrations/20251015235935_use_is_published_columns.sql"
  )
  const migration = readSource(
    "supabase/migrations/20260806010000_harden_fiscal_sponsorship_rls.sql"
  )
  const assertions = readSource(
    "supabase/tests/fiscal-final-schema-rls.assertions.sql"
  )
  const runner = readSource("supabase/tests/fiscal-final-schema-rls.test.mjs")
  const remoteRls = readSource("supabase/tests/rls.test.mjs")

  it("keeps the full migration chain compatible with a fresh database", () => {
    expect(publicationMigration).toContain("information_schema.columns")
    expect(publicationMigration).toContain("column_name = 'published'")
    expect(publicationMigration).not.toContain(
      "update public.classes set is_published = coalesce(published, false);"
    )
    expect(publicationMigration).not.toContain(
      "update public.modules set is_published = coalesce(published, false);"
    )
  })

  it("scopes sponsor access to developers or assigned coaches", () => {
    expect(migration).toContain("can_manage_fiscal_sponsorship_organization")
    expect(migration).toContain("public.is_admin()")
    expect(migration).toContain("organization_coach_assignments")
    expect(migration).toContain(
      "assignment.coach_user_id = (select auth.uid())"
    )
    expect(migration).not.toContain("public.is_platform_staff()")
  })

  it("keeps authoritative writes service-only and applicant drafts resumable", () => {
    expect(migration).toContain("revoke insert, update, delete")
    expect(migration).toContain("public.fiscal_sponsorship_applications")
    expect(migration).toContain("public.fiscal_sponsorship_reviews")
    expect(migration).toContain("public.fiscal_sponsorship_documents")
    expect(migration).toContain("public.fiscal_sponsorship_signature_packets")
    expect(migration).toContain("public.fiscal_sponsorship_events")
    expect(migration).toContain("public.fiscal_sponsorship_signatures")
    expect(migration).toContain(
      "on table public.fiscal_sponsorship_signing_drafts"
    )
    expect(migration).toContain("grant select, insert, update, delete")
  })

  it("executes the real migration against every required role", () => {
    expect(runner).toContain(
      'runSql("supabase/migrations/20260806010000_harden_fiscal_sponsorship_rls.sql")'
    )
    for (const evidence of [
      "Organization owner fiscal read matrix failed",
      "Organization staff fiscal document visibility failed",
      "Board read-only fiscal visibility failed",
      "Sponsor operator fiscal visibility failed",
      "Assigned coach fiscal read matrix failed",
      "Unassigned coach crossed the organization boundary",
      "Unrelated authenticated user crossed the organization boundary",
      "Authenticated retains direct DML",
    ]) {
      expect(assertions).toContain(evidence)
    }
  })

  it("keeps the connected Supabase suite aligned with final write semantics", () => {
    expect(remoteRls).toContain(
      "service role creates authoritative fiscal documents"
    )
    expect(remoteRls).toContain(
      "platform admin cannot bypass authoritative fiscal document transition"
    )
    expect(remoteRls).toContain('["unassigned coach", coachClient, 0]')
    expect(remoteRls).toContain(
      "assigned coach has scoped fiscal document visibility"
    )
    expect(remoteRls).not.toContain(
      "owner can insert fiscal sponsorship required documents"
    )
    expect(remoteRls).not.toContain(
      "platform admin can insert fiscal sponsorship required documents"
    )
  })
})
