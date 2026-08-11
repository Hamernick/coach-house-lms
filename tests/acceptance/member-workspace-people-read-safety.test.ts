import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const source = readFileSync(
  join(
    process.cwd(),
    "src/features/member-workspace/server/loaders.ts",
  ),
  "utf8",
)

describe("member workspace People read safety", () => {
  it("does not write the organization profile while loading People", () => {
    expect(source).not.toContain("mutateOrganizationPeopleProfile")
    expect(source).not.toContain(".upsert(")
    expect(source).not.toContain(".update(")
    expect(source).not.toContain(".insert(")
  })

  it("still synchronizes the signed-in member for display", () => {
    expect(source).toContain("const sync = synchronizeSelf(peopleRaw)")
    expect(source).toContain(
      "peopleRaw.splice(0, peopleRaw.length, ...sync.people)",
    )
  })
})
