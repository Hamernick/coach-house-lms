import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

describe("documents result row keys", () => {
  it("places mapped row keys before focus prop spreads", () => {
    const tableRowSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-row.tsx"
    )
    const mobileSource = readSource(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-mobile.tsx"
    )
    const focusSpread =
      "{...getOrganizationFocusTargetProps(getDocumentRowFocusKey(row))}"

    for (const source of [tableRowSource, mobileSource]) {
      expect(source.indexOf("key={row.id}")).toBeGreaterThanOrEqual(0)
      expect(source.indexOf(focusSpread)).toBeGreaterThan(
        source.indexOf("key={row.id}")
      )
    }
  })
})
