import { createElement } from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  useWorkspaceBoardOrganizationAccessStateMock,
  workspaceBoardInviteSheetMock,
  workspaceBoardTeamAccessHoverCardMock,
} = vi.hoisted(() => ({
  useWorkspaceBoardOrganizationAccessStateMock: vi.fn(),
  workspaceBoardInviteSheetMock: vi.fn((_props: unknown) => null),
  workspaceBoardTeamAccessHoverCardMock: vi.fn((_props: unknown) => null),
}))

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-organization-access-state",
  () => ({
    useWorkspaceBoardOrganizationAccessState:
      useWorkspaceBoardOrganizationAccessStateMock,
  })
)

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-invite-sheet",
  () => ({
    WorkspaceBoardInviteSheet: (props: unknown) => {
      workspaceBoardInviteSheetMock(props)
      return null
    },
  })
)

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-hover-card",
  () => ({
    WorkspaceBoardTeamAccessHoverCard: (props: unknown) => {
      workspaceBoardTeamAccessHoverCardMock(props)
      return null
    },
  })
)

import { WorkspaceBoardTeamAccessSection } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-section"

const ROOT = process.cwd()

function readSource(relativePath: string) {
  return readFileSync(join(ROOT, relativePath), "utf8")
}

function createOrganizationAccessState(
  overrides: Record<string, unknown> = {}
) {
  return {
    loading: false,
    loadError: null,
    invites: [],
    requests: [],
    canInviteTeam: false,
    hasPaidTeamAccess: true,
    inviteCapabilityMessage: null,
    refresh: vi.fn(async () => {}),
    ...overrides,
  }
}

function renderSection() {
  return renderToStaticMarkup(
    createElement(WorkspaceBoardTeamAccessSection, {
      canInvite: false,
      members: [],
      invites: [],
      realtimeState: "connecting",
      currentUser: {
        id: "org-1",
        name: "Bright Futures Collective",
        avatarUrl: null,
      },
      uiPreferencesScope: {
        orgId: "org-1",
        viewerId: "user-1",
      },
      onInvitesChange: vi.fn(),
    })
  )
}

describe("WorkspaceBoardTeamAccessSection", () => {
  beforeEach(() => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReset()
    workspaceBoardInviteSheetMock.mockClear()
    workspaceBoardTeamAccessHoverCardMock.mockClear()
  })

  it("renders Team Access as a collapsible right-rail section header", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState()
    )

    const markup = renderSection()
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-section.tsx"
    )

    expect(markup).toContain("Team Access")
    expect(markup).toContain('aria-controls="workspace-team-access-content"')
    expect(markup).toContain('aria-expanded="true"')
    expect(markup).toContain(
      "hover:bg-muted/30 h-8 w-full justify-between rounded-lg px-2.5 py-0 text-left"
    )
    expect(source).toContain("setTeamAccessCollapsed")
    expect(source).toContain("readWorkspaceBoardUiPreferences")
    expect(source).toContain("patchWorkspaceBoardUiPreferences")
    expect(source).toContain("teamAccessCollapsed: nextCollapsed")
    expect(source).toContain("teamAccessCollapsed ? null")
    expect(source).toContain("ChevronDownIcon")
  })

  it("does not show the solo empty state while team access is still loading", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({
        loading: true,
      })
    )

    const markup = renderSection()

    expect(markup).toContain("Checking team access…")
    expect(markup).not.toContain("No Team Members")
    expect(
      workspaceBoardTeamAccessHoverCardMock.mock.calls[0]?.[0]
    ).toMatchObject({
      organizationAccessLoading: true,
      organizationAccessLoadError: null,
    })
  })

  it("does not show the solo empty state when team access failed to refresh", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({
        loadError: "Unable to load team access.",
      })
    )

    const markup = renderSection()

    expect(markup).toContain("Team access unavailable right now.")
    expect(markup).not.toContain("No Team Members")
    expect(
      workspaceBoardTeamAccessHoverCardMock.mock.calls[0]?.[0]
    ).toMatchObject({
      organizationAccessLoading: false,
      organizationAccessLoadError: "Unable to load team access.",
    })
  })
})
