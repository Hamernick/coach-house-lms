import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

describe("accelerator roadmap homework completion", () => {
  it("migrates roadmap homework assignments to complete on submit", () => {
    const migration = readFileSync(
      join(
        ROOT,
        "supabase/migrations/20260427220500_mark_roadmap_homework_complete_on_submit.sql",
      ),
      "utf8",
    )

    expect(migration).toContain("set complete_on_submit = true")
    expect(migration).toContain("c.slug = 'strategic-foundations'")
    expect(migration).toContain("m.slug in ('what-is-the-need', 'ai-the-need')")
    expect(migration).toContain("c.slug = 'mission-vision-values'")
    expect(migration).toContain("m.slug in ('mission', 'vision', 'values')")
    expect(migration).toContain("'label', 'Six favorite mission statements'")
    expect(migration).toContain("'label', 'Six favorite vision statements'")
    expect(migration).toContain("'label', 'Vision statement'")
    expect(migration).toContain("'org_key', 'vision'")
  })
})
