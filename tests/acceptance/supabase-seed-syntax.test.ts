import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("Supabase seed syntax", () => {
  it("uses SQL-standard escaping for apostrophes", () => {
    const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")

    expect(seed).not.toMatch(/\\+'/)
    expect(seed).toContain("(Don''t worry about amounts for now).")
  })

  it("redeclares the theory-of-change module CTE for each statement", () => {
    const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")

    expect(seed.match(/with toc_module as \(/g)).toHaveLength(2)
    expect(seed.match(/from toc_module t/g)).toHaveLength(2)
  })

  it("uses canonical module slugs throughout repeated curriculum seeds", () => {
    const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")

    expect(seed).not.toContain("'intro-idea-to-impact-accelerator'")
    expect(seed).not.toContain("'develop-a-pilot'")
    expect(seed).toContain("'introduction-idea-to-impact-accelerator'")
    expect(seed).toContain("'program-develop-a-pilot'")
  })

  it("preserves the migrated elective module positions", () => {
    const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")

    expect(seed).toContain(
      "('electives', 4, 'organization-setup', 'Organization setup')"
    )
    expect(seed).toContain(
      "('electives', 5, 'naming-your-nfp', 'Naming your NFP')"
    )
    expect(seed).toContain(
      "('electives', 6, 'nfp-registration', 'NFP Registration')"
    )
    expect(seed).toContain("('electives', 7, 'filing-1023', 'Filing 1023')")
  })
})
