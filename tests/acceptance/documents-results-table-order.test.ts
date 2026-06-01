import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("documents results table column order", () => {
  it("keeps status in the former visibility column slot", () => {
    const headerSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-header.tsx",
      "utf8",
    )
    const rowSource = readFileSync(
      "src/components/organization/org-profile-card/tabs/documents-tab/components/documents-results-table-row.tsx",
      "utf8",
    )

    expect(headerSource.indexOf('column="visibility"')).toBeLessThan(
      headerSource.indexOf('column="name"'),
    )
    expect(headerSource.indexOf('column="source"')).toBeLessThan(
      headerSource.indexOf('column="status"'),
    )
    expect(headerSource.indexOf('column="status"')).toBeLessThan(
      headerSource.indexOf('column="updatedAt"'),
    )

    expect(rowSource.indexOf("row.visibility")).toBeLessThan(
      rowSource.indexOf("row.name"),
    )
    expect(rowSource.indexOf("SOURCE_LABEL[row.source]")).toBeLessThan(
      rowSource.indexOf("StatusBadge status={row.status}"),
    )
    expect(rowSource.indexOf("StatusBadge status={row.status}")).toBeLessThan(
      rowSource.indexOf("formatUpdatedAt(row.updatedAt)"),
    )
  })
})
