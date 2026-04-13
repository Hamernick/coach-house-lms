import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { SidebarProvider } from "@/components/ui/sidebar"
import { MemberWorkspaceProjectDetailPage } from "@/features/member-workspace"
import { getProjectDetailsById } from "@/features/platform-admin-dashboard/upstream/lib/data/project-details"
import {
  buildMemberWorkspaceProjectDetailDraft,
  buildMemberWorkspaceProjectUpdateInput,
} from "@/features/member-workspace/components/projects/member-workspace-project-detail-editing"
import { MemberWorkspaceProjectDetailHeader } from "@/features/member-workspace/components/projects/member-workspace-project-detail-header"
import { MemberWorkspaceProjectTasksEditor } from "@/features/member-workspace/components/projects/member-workspace-project-tasks-editor"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: () => undefined,
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
  unstable_cache: <T extends (...args: never[]) => unknown>(fn: T) => fn,
}))

const project = getProjectDetailsById("project-1")

function renderProjectDetailPage(
  overrideProps?: Partial<
    React.ComponentProps<typeof MemberWorkspaceProjectDetailPage>
  >,
) {
  return renderToStaticMarkup(
    React.createElement(
      SidebarProvider,
      { defaultOpen: true },
      React.createElement(MemberWorkspaceProjectDetailPage, {
        project,
        assigneeOptions: [],
        currentUser: {
          id: "user-1",
          name: "Alex Rivera",
          avatarUrl: "https://example.com/alex.png",
        },
        organizationSummary: {
          orgId: "org-1",
          canonicalProjectId: "project-1",
          name: "Coach House",
          ownerName: "Alex Rivera",
          ownerAvatarUrl: "https://example.com/alex.png",
          publicSlug: "coach-house",
          organizationStatus: "approved",
          isPublic: false,
          createdAt: "2026-04-01T00:00:00.000Z",
          updatedAt: "2026-04-02T00:00:00.000Z",
          acceleratorProgress: 64,
          setupProgress: 75,
          setupCompletedCount: 9,
          setupTotalCount: 12,
          missingSetupCount: 2,
          memberCount: 3,
          tags: [],
          members: [],
          setupItems: [],
          profile: {},
        },
        updateProjectAction: async () => ({ ok: true, id: project.id }),
        ...overrideProps,
      })
    )
  )
}

describe("MemberWorkspaceProjectDetailPage", () => {
  it("restores the local sidebar trigger beside the project breadcrumbs", () => {
    const markup = renderProjectDetailPage()

    expect(markup).toContain('data-slot="sidebar-trigger"')
    expect(markup).toContain('aria-label="Toggle sidebar"')
    expect(markup).toContain(
      "text-muted-foreground hover:text-foreground size-8 rounded-lg"
    )
    expect(markup).toContain('aria-label="Edit project"')
    expect(markup.indexOf('data-slot="sidebar-trigger"')).toBeLessThan(
      markup.indexOf("Projects")
    )
  })

  it("renders the inline header editing surface without relying on a dialog", () => {
    const draft = buildMemberWorkspaceProjectDetailDraft(project)
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectDetailHeader, {
        project,
        canEditProject: true,
        isEditing: true,
        draft,
        onChangeDraftField: () => undefined,
      })
    )

    expect(markup).toContain("Edit mode")
    expect(markup).toContain('id="member-workspace-project-name"')
    expect(markup).toContain('id="member-workspace-project-status"')
    expect(markup).toContain('id="member-workspace-project-start-date"')
    expect(markup).toContain('id="member-workspace-project-members"')
    expect(markup).not.toContain('aria-label="Edit project"')
  })

  it("serializes the overview editor fields back into the project update payload", () => {
    const draft = buildMemberWorkspaceProjectDetailDraft(project)
    const payload = buildMemberWorkspaceProjectUpdateInput({
      project,
      draft: {
        ...draft,
        summary: "Launch a cleaner member project view",
        scopeIn: "Inline editing\nMobile-first layout",
        scopeOut: "Separate admin settings",
        outcomes: "Reduce page jumps\nKeep edits in context",
        keyFeaturesP0: "Header inline form",
        keyFeaturesP1: "Overview editor",
        keyFeaturesP2: "Timeline follow-up",
      },
    })

    expect(payload.description).toContain("Goal:")
    expect(payload.description).toContain(
      "- Launch a cleaner member project view"
    )
    expect(payload.description).toContain("In scope:")
    expect(payload.description).toContain("- Inline editing")
    expect(payload.description).toContain("P2:")
    expect(payload.tags).toBe(project.source?.tags.join(", "))
  })

  it("renders inline task editing controls that stay usable on mobile", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectTasksEditor, {
        project,
        assigneeOptions: [],
      })
    )

    expect(markup).toContain("Task rows edit inline while the page stays in edit mode.")
    expect(markup).toContain("Add task")
    expect(markup).toContain("Edit task")
    expect(markup).toContain("Delete")
    expect(markup).toContain("Up")
    expect(markup).toContain("Down")
    expect(markup).not.toContain('role="dialog"')
  })

  it("hides the location chip when the project detail has no real location data", () => {
    const markup = renderToStaticMarkup(
      React.createElement(MemberWorkspaceProjectDetailHeader, {
        project: {
          ...project,
          meta: {
            ...project.meta,
            locationLabel: undefined,
          },
        },
        canEditProject: true,
        isEditing: false,
      })
    )

    expect(markup).not.toContain("Australia")
    expect(markup).not.toContain(">Location<")
  })

  it("renders admin project detail surfaces as read-only", () => {
    const markup = renderProjectDetailPage({
      canManageProject: false,
      updateProjectAction: undefined,
    })

    expect(markup).not.toContain('aria-label="Edit project"')
    expect(markup).not.toContain("Save changes")
    expect(markup).not.toContain("Add notes")
    expect(markup).not.toContain("Add File")
    expect(markup).not.toContain("New Task")
  })
})
