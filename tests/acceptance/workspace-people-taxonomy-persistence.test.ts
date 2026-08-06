import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("workspace People taxonomy persistence", () => {
  it("uses typed organization tables without runtime profile fallbacks", () => {
    const segmentActions = readSource("src/actions/people-segments.ts")
    const segmentLoader = readSource(
      "src/app/(dashboard)/my-organization/_lib/workspace-people-segments.ts"
    )
    const tagActions = readSource("src/actions/people-tags.ts")
    const tagLoader = readSource(
      "src/app/(dashboard)/my-organization/_lib/workspace-people-tags.ts"
    )

    expect(segmentActions).toContain('.from("organization_people_segments")')
    expect(segmentActions).toContain(
      '.from("organization_people_segment_members")'
    )
    expect(segmentLoader).toContain('.from("organization_people_segments")')
    expect(segmentLoader).toContain(
      '.from("organization_people_segment_members")'
    )
    expect(tagActions).toContain('.from("organization_people_tags")')
    expect(tagActions).toContain('.from("organization_people_tag_members")')
    expect(tagLoader).toContain('.from("organization_people_tags")')
    expect(tagLoader).toContain('.from("organization_people_tag_members")')

    for (const source of [segmentActions, segmentLoader]) {
      expect(source).not.toContain("workspace_people_segments_v1")
      expect(source).not.toContain("writeFallbackSegments")
      expect(source).not.toContain("readFallbackSegments")
    }
    expect(tagActions).not.toContain("legacy:")
    expect(tagLoader).not.toContain("buildLegacyPeopleTags")
    expect(segmentLoader).toContain("Unable to load people segments.")
    expect(tagLoader).toContain("Unable to load people tags.")
  })

  it("keeps one-time backfills and organization-scoped RLS at the migration boundary", () => {
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
