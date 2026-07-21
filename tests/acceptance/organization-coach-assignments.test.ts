import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import { getOrganizationCoachInitials } from "@/features/organization-coach-assignments"

describe("organization-coach-assignments feature contract", () => {
  it("builds compact coach initials", () => {
    expect(
      getOrganizationCoachInitials({
        id: "coach-id",
        name: "Paula Coach",
        email: null,
        avatarUrl: null,
      })
    ).toBe("PC")
  })

  it("keeps writes developer-only and reads internal", () => {
    const migration = readFileSync(
      resolve(
        process.cwd(),
        "supabase/migrations/20260721153000_add_organization_coach_assignments.sql"
      ),
      "utf8"
    )

    expect(migration).toContain("using ((select public.is_platform_staff()))")
    expect(migration).toContain("with check ((select public.is_admin()))")
    expect(migration).toContain("require_coach_assignment_access_level")
    expect(migration).toContain("prevent_assigned_coach_access_change")
    expect(migration).toContain("force row level security")
  })

  it("validates developer access again inside the server action", () => {
    const action = readFileSync(
      resolve(
        process.cwd(),
        "src/features/organization-coach-assignments/server/actions.ts"
      ),
      "utf8"
    )

    expect(action).toContain('platformAccessLevel !== "developer"')
    expect(action).toContain('.eq("access_level", "coach")')
  })
})
