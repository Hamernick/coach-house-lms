import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("People taxonomy persistence", () => {
  it("uses typed organization tables without profile fallback writes", () => {
    const segmentActions = readSource("src/actions/people-segments.ts")
    const tagActions = readSource("src/actions/people-tags.ts")

    expect(segmentActions).toContain('.from("organization_people_segments")')
    expect(segmentActions).toContain(
      '.from("organization_people_segment_members")'
    )
    expect(tagActions).toContain('.from("organization_people_tags")')
    expect(tagActions).toContain('.from("organization_people_tag_members")')
    expect(segmentActions).not.toContain("workspace_people_segments_v1")
    expect(tagActions).not.toContain("legacy:")
  })

  it("keeps backfills and organization-scoped RLS at the migration boundary", () => {
    const segmentMigration = readSource(
      "supabase/migrations/20260801130500_add_organization_people_segments.sql"
    )
    const tagMigration = readSource(
      "supabase/migrations/20260801143000_add_organization_people_tags.sql"
    )
    const rlsTests = readSource("supabase/tests/rls.test.mjs")

    expect(segmentMigration).toContain("workspace_people_segments_v1")
    expect(segmentMigration).toContain(
      "alter table organization_people_segments force row level security"
    )
    expect(segmentMigration).toContain(
      'create policy "organization_people_segment_members_insert"'
    )
    expect(tagMigration).toContain(
      "insert into organization_people_tag_members"
    )
    expect(tagMigration).toContain(
      "alter table organization_people_tags force row level security"
    )
    expect(tagMigration).toContain(
      'create policy "organization_people_tag_members_insert"'
    )
    expect(rlsTests).toContain("staff can create organization people segments")
    expect(rlsTests).toContain(
      "board cannot create organization people segments"
    )
    expect(rlsTests).toContain(
      "staff can create colored organization people tags"
    )
    expect(rlsTests).toContain("board cannot update organization people tags")
  })
})
