import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("people actions access", () => {
  it("lets platform admins manage active organization people records", () => {
    const source = readSource("src/actions/people.ts")

    expect(source).toContain("async function resolvePeopleManagementAccess")
    expect(source).toContain("canEditOrganization(role)")
    expect(source).toContain('.from("profiles")')
    expect(source).toContain('.select("role")')
    expect(source).toContain('profileRow?.role === "admin"')
    expect(source).toContain("canManagePeople")
    expect(source.match(/if \(!canManagePeople\) return/g)?.length).toBe(3)
    expect(source).not.toContain(
      'if (!canEditOrganization(role)) return { error: "Forbidden" }'
    )
  })
})
