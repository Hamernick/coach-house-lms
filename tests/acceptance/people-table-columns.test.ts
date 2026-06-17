import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

describe("people table columns", () => {
  it("labels the person category column as Relationship", () => {
    const source = readFileSync("src/components/people/people-table-columns.tsx", "utf8")

    expect(source).toContain('accessorKey: "category"')
    expect(source).toContain('header: "Relationship"')
    expect(source).not.toContain('header: "Category"')
  })
})
