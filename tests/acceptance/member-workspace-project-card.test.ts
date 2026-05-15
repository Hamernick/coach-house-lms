import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import type { PlatformAdminDashboardLabProject } from "@/features/platform-admin-dashboard"
import { MemberWorkspaceProjectCard } from "@/features/member-workspace/components/projects/member-workspace-project-card"

const projectCardSource =
  "src/features/member-workspace/components/projects/member-workspace-project-card.tsx"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => undefined,
  }),
}))

const organizationProject: PlatformAdminDashboardLabProject = {
  id: "project-1",
  organizationId: "org-1",
  projectKind: "organization_admin",
  name: "Community Builders",
  description: "Support the org through accelerator setup.",
  taskCount: 10,
  progress: 62,
  startDate: new Date("2026-04-01T00:00:00.000Z"),
  endDate: new Date("2026-04-30T12:00:00.000Z"),
  status: "active",
  priority: "medium",
  tags: ["organization", "onboarding"],
  members: ["Paula Founder", "Chris Ops"],
  primaryPersonName: "Paula Founder",
  primaryPersonAvatarUrl: null,
  client: "/community-builders",
  typeLabel: "Approved nonprofit",
  durationLabel: "3 members",
  taskSummaryLabel: "Setup items",
  tasks: [
    {
      id: "task-1",
      name: "Add organization name",
      type: "task",
      assignee: "Paula Founder",
      status: "done",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
    },
    {
      id: "task-2",
      name: "Add tagline",
      type: "task",
      assignee: "Paula Founder",
      status: "done",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
    },
    {
      id: "task-3",
      name: "Complete roadmap: Program",
      type: "task",
      assignee: "Paula Founder",
      status: "todo",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T00:00:00.000Z"),
    },
  ],
}

describe("MemberWorkspaceProjectCard", () => {
  it("renders organization-aware metadata for platform admin cards", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectCard, {
        project: organizationProject,
      }),
    )

    expect(markup).toContain("Community Builders")
    expect(markup).toContain("Created by Paula Founder")
    expect(markup).toContain("Approved nonprofit")
    expect(markup).toContain("/community-builders")
    expect(markup).toContain("62%")
    expect(markup).toContain("2 / 3 Setup items")
    expect(markup).toContain(">PF<")
  })

  it("keeps the progress summary and separator in the card footer", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectCard, {
        project: organizationProject,
      }),
    )
    const footerIndex = markup.indexOf('class="mt-auto pt-4"')
    const dueDateIndex = markup.indexOf("Apr 30, 2026")
    const separatorIndex = markup.indexOf('class="border-t border-border/60"')

    expect(markup).toContain("flex h-full cursor-pointer flex-col")
    expect(markup).toContain("flex flex-1 flex-col p-4")
    expect(markup).toContain('class="mt-auto pt-4"')
    expect(markup).toContain('class="mb-4 flex items-center justify-between text-sm text-muted-foreground"')
    expect(markup).toContain('class="border-t border-border/60"')
    expect(dueDateIndex).toBeGreaterThan(footerIndex)
    expect(dueDateIndex).toBeLessThan(separatorIndex)
  })

  it("exposes stable React Grab ownership for card sub-surfaces", () => {
    const listMarkup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectCard, {
        project: organizationProject,
      }),
    )
    const boardMarkup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectCard, {
        project: organizationProject,
        variant: "board",
      }),
    )

    expect(listMarkup).toContain('data-react-grab-anchor="MemberWorkspaceProjectCard"')
    expect(listMarkup).toContain(
      'data-react-grab-owner-id="member-workspace-project-card:list:project-1"',
    )
    expect(listMarkup).toContain(`data-react-grab-owner-source="${projectCardSource}"`)
    expect(listMarkup).toContain(`data-react-grab-canonical-owner-source="${projectCardSource}"`)
    expect(listMarkup).toContain('data-react-grab-owner-slot="card"')
    expect(listMarkup).toContain('data-react-grab-owner-variant="list"')

    for (const slot of [
      "status-pill",
      "title",
      "metadata",
      "footer",
      "date-priority-row",
      "due-date",
      "priority",
      "footer-separator",
      "progress-row",
      "assignee-avatar",
    ]) {
      expect(listMarkup).toContain(`data-react-grab-surface-slot="${slot}"`)
    }

    expect(boardMarkup).toContain(
      'data-react-grab-owner-id="member-workspace-project-card:board:project-1"',
    )
    expect(boardMarkup).toContain('data-react-grab-owner-variant="board"')
    expect(boardMarkup).toContain('data-react-grab-surface-slot="board-due-date"')
    expect(boardMarkup).toContain('data-react-grab-surface-slot="header-priority"')
  })
})
