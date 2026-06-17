import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const ROOT = process.cwd()

describe("seed-full-account dry-run", () => {
  it("validates fixture consistency without Supabase credentials", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/seed-full-account.mjs",
        "--dry-run",
        "true",
        "--email",
        "qa.seed@example.com",
        "--progress",
        "mixed",
      ],
      { encoding: "utf8" }
    )

    expect(output).toContain("Dry run: full-account seed fixture validation")
    expect(output).toContain("email_preview: qa.seed@example.com")
    expect(output).toContain("roadmap_status_counts: complete=")
    expect(output).toContain("org_people_seeded:")
    expect(output).toContain("Seed fixture validation passed.")
  })

  it("exposes a fiscal sponsorship case-study fixture for superadmin walkthroughs", () => {
    const output = execFileSync(
      "node",
      [
        "scripts/seed-full-account.mjs",
        "--dry-run",
        "true",
        "--email",
        "caleb@bandto.example",
        "--case-study",
        "fiscal-sponsorship",
        "--slug",
        "testing123",
      ],
      { encoding: "utf8" }
    )
    const script = readFileSync(
      join(ROOT, "scripts/seed-full-account.mjs"),
      "utf8"
    )
    const brief = readFileSync(
      join(ROOT, "docs/briefs/fiscal-sponsorship-prefill-walkthrough.md"),
      "utf8"
    )

    expect(output).toContain("case_study: fiscal-sponsorship")
    expect(output).toContain("org_name: testing123 Southside Community Table")
    expect(output).toContain("project_name: Southside Community Table")
    expect(output).toContain("roadmap_sections: 17")
    expect(output).toContain("fiscal_required_documents: 8")
    expect(script).toContain("fiscal_sponsorship_applications")
    expect(script).toContain("fiscal_sponsorship_documents")
    expect(script).toContain("fundraising_strategy")
    expect(script).toContain("fundraising_presentation")
    expect(script).toContain("fundraising_crm_plan")
    expect(script).toContain("board_calendar")
    expect(script).toContain("board_handbook")
    expect(script).toContain("organization_project_assets")
    expect(script).toContain("organization_project_notes")
    expect(script).toContain("organization_project_quick_links")
    expect(script).toContain('objectKind: "Project"')
    expect(script).toContain('objectKind: "Service"')
    expect(script).toContain('objectKind: "Program"')
    expect(script).toContain("tax_id_confirmation")
    expect(script).toContain("governing_documents")
    expect(script).toContain("formation_or_good_standing")
    expect(script).toContain("budget_support")
    expect(script).toContain("fundraising_materials")
    expect(script).toContain("insurance")
    expect(script).toContain("grant_request_support")
    expect(script).toContain("additional_info")
    expect(script).toContain("generatedByAi: false")
    expect(brief).toContain("never AI-generate agreements")
    expect(brief).toContain("/fiscal-sponsorship/handbook")
    expect(brief).toContain("/organizations")
    expect(brief).toContain("Subtle green dot")
    expect(brief).toContain("Subtle orange dot")
  })
})
