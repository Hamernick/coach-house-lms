import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { MemberWorkspaceProjectCard } from "@/features/member-workspace/components/projects/member-workspace-project-card"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: () => undefined,
  }),
}))

describe("MemberWorkspaceProjectCard", () => {
  it("renders organization-aware metadata for platform admin cards", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectCard, {
        project: {
          id: "project-1",
          organizationId: "org-1",
          projectKind: "organization_admin",
          name: "Community Builders",
          description: "Support the org through accelerator setup.",
          taskCount: 10,
          progress: 62,
          startDate: new Date("2026-04-01T00:00:00.000Z"),
          endDate: new Date("2026-04-30T00:00:00.000Z"),
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
        },
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
})
