import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

describe("Supabase seed syntax", () => {
  it("uses SQL-standard escaping for apostrophes", () => {
    const seed = readFileSync(join(process.cwd(), "supabase/seed.sql"), "utf8")

    expect(seed).not.toMatch(/\\+'/)
    expect(seed).toContain("(Don''t worry about amounts for now).")
  })
})
