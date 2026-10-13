import { execFileSync } from "node:child_process"

import { describe, expect, it } from "vitest"

describe("seed-full-account dry-run", () => {
  it("validates fixture consistency without Supabase credentials", () => {
    const output = execFileSync(
      "node",
      ["scripts/seed-full-account.mjs", "--dry-run", "true", "--email", "qa.seed@example.com", "--progress", "mixed"],
      { encoding: "utf8" },
    )

    expect(output).toContain("Dry run: full-account seed fixture validation")
    expect(output).toContain("email_preview: qa.seed@example.com")
    expect(output).toContain("roadmap_status_counts: complete=")
    expect(output).toContain("org_people_seeded:")
    expect(output).toContain("Seed fixture validation passed.")
  })
})
