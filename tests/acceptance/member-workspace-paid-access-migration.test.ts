import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const migrationSql = readFileSync(
  "supabase/migrations/20260505120000_gate_member_workspace_paid_access.sql",
  "utf8",
)

describe("member workspace paid access migration", () => {
  it("gates project and task RLS policies through paid member workspace helpers", () => {
    expect(migrationSql).toContain(
      "create or replace function public.can_read_member_workspace_org(org_user_id uuid)",
    )
    expect(migrationSql).toContain(
      "create or replace function public.can_write_member_workspace_org(org_user_id uuid)",
    )
    expect(migrationSql).toContain("s.status in ('active', 'trialing')")
    expect(migrationSql).toContain("not like '%free%'")

    for (const table of [
      "organization_projects",
      "organization_tasks",
      "organization_task_assignees",
      "organization_project_notes",
      "organization_project_quick_links",
      "organization_project_assets",
    ]) {
      expect(migrationSql).toContain(`drop policy if exists "${table}_select"`)
      expect(migrationSql).toContain(
        `create policy "${table}_select" on public.${table}`,
      )
      expect(migrationSql).toContain("using (public.can_read_member_workspace_org(org_id))")
    }
  })
})
