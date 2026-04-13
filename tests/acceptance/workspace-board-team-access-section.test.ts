import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  useWorkspaceBoardOrganizationAccessStateMock,
  workspaceBoardInviteSheetMock,
  workspaceBoardTeamAccessHoverCardMock,
} = vi.hoisted(() => ({
  useWorkspaceBoardOrganizationAccessStateMock: vi.fn(),
  workspaceBoardInviteSheetMock: vi.fn(() => null),
  workspaceBoardTeamAccessHoverCardMock: vi.fn(() => null),
}))

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-organization-access-state",
  () => ({
    useWorkspaceBoardOrganizationAccessState:
      useWorkspaceBoardOrganizationAccessStateMock,
  }),
)

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-invite-sheet",
  () => ({
    WorkspaceBoardInviteSheet: (props: unknown) => {
      workspaceBoardInviteSheetMock(props)
      return null
    },
  }),
)

vi.mock(
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-hover-card",
  () => ({
    WorkspaceBoardTeamAccessHoverCard: (props: unknown) => {
      workspaceBoardTeamAccessHoverCardMock(props)
      return null
    },
  }),
)

import { WorkspaceBoardTeamAccessSection } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-section"

function createOrganizationAccessState(
  overrides: Record<string, unknown> = {},
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
      onInvitesChange: vi.fn(),
    }),
  )
}

describe("WorkspaceBoardTeamAccessSection", () => {
  beforeEach(() => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReset()
    workspaceBoardInviteSheetMock.mockClear()
    workspaceBoardTeamAccessHoverCardMock.mockClear()
  })

  it("does not show the solo empty state while team access is still loading", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({
        loading: true,
      }),
    )

    const markup = renderSection()

    expect(markup).toContain("Checking team access…")
    expect(markup).not.toContain("No Team Members")
    expect(workspaceBoardTeamAccessHoverCardMock.mock.calls[0]?.[0]).toMatchObject({
      organizationAccessLoading: true,
      organizationAccessLoadError: null,
    })
  })

  it("does not show the solo empty state when team access failed to refresh", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({
        loadError: "Unable to load team access.",
      }),
    )

    const markup = renderSection()

    expect(markup).toContain("Team access unavailable right now.")
    expect(markup).not.toContain("No Team Members")
    expect(workspaceBoardTeamAccessHoverCardMock.mock.calls[0]?.[0]).toMatchObject({
      organizationAccessLoading: false,
      organizationAccessLoadError: "Unable to load team access.",
    })
  })
})
