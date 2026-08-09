import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { describe, expect, it } from "vitest"

import {
  applyOrganizationKanbanVisibilityToParams,
  computeOrganizationKanbanVisibilityCounts,
  filterProjectsByOrganizationKanbanVisibility,
  normalizeOrganizationKanbanVisibilityMode,
} from "@/features/organization-kanban-visibility"

const source = (path: string) =>
  readFileSync(resolve(process.cwd(), path), "utf8")

const projects = [
  {
    id: "org-a",
    organizationId: "a",
    projectKind: "organization_admin",
  },
  {
    id: "project-a",
    organizationId: "a",
    projectKind: "standard",
  },
  {
    id: "org-b",
    organizationId: "b",
    projectKind: "organization_admin",
  },
  {
    id: "platform-note",
    organizationId: null,
    projectKind: "standard",
  },
]

describe("organization Kanban visibility", () => {
  it("normalizes the URL-backed visibility mode", () => {
    expect(normalizeOrganizationKanbanVisibilityMode("hidden")).toBe("hidden")
    expect(normalizeOrganizationKanbanVisibilityMode("invalid")).toBe("visible")

    const params = new URLSearchParams("coach=paula&visibility=hidden")
    applyOrganizationKanbanVisibilityToParams(params, "visible")
    expect(params.toString()).toBe("coach=paula")
    applyOrganizationKanbanVisibilityToParams(params, "hidden")
    expect(params.toString()).toBe("coach=paula&visibility=hidden")
  })

  it("hides an organization and its projects from My Kanban", () => {
    const result = filterProjectsByOrganizationKanbanVisibility({
      hiddenOrganizationIds: new Set(["a"]),
      mode: "visible",
      projects,
    })

    expect(result.map((project) => project.id)).toEqual([
      "org-b",
      "platform-note",
    ])
  })

  it("keeps a recoverable Hidden view limited to organization cards", () => {
    const result = filterProjectsByOrganizationKanbanVisibility({
      hiddenOrganizationIds: new Set(["a"]),
      mode: "hidden",
      projects,
    })

    expect(result.map((project) => project.id)).toEqual(["org-a"])
  })

  it("counts only accessible organization cards", () => {
    expect(
      computeOrganizationKanbanVisibilityCounts({
        hiddenOrganizationIds: new Set(["a", "stale"]),
        projects,
      })
    ).toEqual({ hidden: 1, visible: 1 })
  })

  it("stores personal preferences behind own-row RLS", () => {
    const migration = source(
      "supabase/migrations/20260722155000_add_organization_staff_kanban_preferences.sql"
    )

    expect(migration).toContain(
      "alter table public.organization_staff_kanban_preferences force row level security"
    )
    expect(migration).toContain("staff_user_id = (select auth.uid())")
    expect(migration).toContain("public.is_platform_staff()")
    expect(migration).toContain(
      "organization_id uuid not null references public.organizations(user_id) on delete cascade"
    )
  })

  it("keeps presentation preferences separate from access and assignment", () => {
    const action = source(
      "src/features/organization-kanban-visibility/server/actions.ts"
    )
    const scope = source("src/lib/admin/organization-coach-scope.ts")
    const readme = source(
      "src/features/organization-kanban-visibility/README.md"
    )

    expect(action).toContain(
      'hasPlatformCapability(accessLevel, "organizations")'
    )
    expect(action).toContain("canAccessOrganizationInCoachScope")
    expect(scope).toContain(
      'if (accessLevel !== "coach") return { mode: "all" }'
    )
    expect(readme).toContain(
      "Hiding an organization never changes platform access"
    )
  })

  it("provides hide, recovery, and URL controls on Organizations", () => {
    const control = source(
      "src/features/organization-kanban-visibility/components/organization-kanban-visibility-control.tsx"
    )
    const empty = source(
      "src/features/organization-kanban-visibility/components/organization-kanban-visibility-empty.tsx"
    )
    const allHiddenEmpty = source(
      "src/features/organization-kanban-visibility/components/organization-kanban-all-hidden-empty.tsx"
    )
    const page = source(
      "src/features/member-workspace/components/projects/member-workspace-projects-page.tsx"
    )
    const header = source(
      "src/features/member-workspace/components/projects/member-workspace-projects-header.tsx"
    )

    expect(control).toContain("Hide ${organizationName} from my Kanban")
    expect(control).toContain("Show ${organizationName} on my Kanban")
    expect(control).toContain("aria-label={label}")
    expect(empty).toContain("No hidden organizations")
    expect(empty).toContain("Return to My Kanban")
    expect(allHiddenEmpty).toContain("Your access is unchanged")
    expect(allHiddenEmpty).toContain("Review hidden organizations")
    expect(page).toContain("applyOrganizationKanbanVisibilityToParams")
    expect(header).toContain("OrganizationKanbanVisibilityFilter")
  })
})
