import { createElement } from "react"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  useWorkspaceBoardOrganizationAccessStateMock,
  workspaceBoardTeamAccessHoverCardMock,
} = vi.hoisted(() => ({
  useWorkspaceBoardOrganizationAccessStateMock: vi.fn(),
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
  "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-hover-card",
  () => ({
    WorkspaceBoardTeamAccessHoverCard: (props: unknown) => {
      workspaceBoardTeamAccessHoverCardMock(props)
      return null
    },
  })
)

import { WorkspaceBoardTeamAccessHeaderActionContent } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-header-action"

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

function renderAction() {
  return renderToStaticMarkup(
    createElement(WorkspaceBoardTeamAccessHeaderActionContent, {
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
    })
  )
}

describe("WorkspaceBoardTeamAccessHeaderAction", () => {
  beforeEach(() => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReset()
    workspaceBoardTeamAccessHoverCardMock.mockClear()
  })

  it("renders the team-access pill for the shell header", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState()
    )

    const markup = renderAction()
    const source = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access-header-action.tsx"
    )

    expect(markup).toContain('data-slot="hover-card-trigger"')
    expect(markup).toContain("Bright Futures Collective")
    expect(markup).toContain("Connecting…")
    expect(markup).toContain("h-9")
    expect(markup).toContain("max-w-[13rem]")
    expect(markup).toContain("min-w-0")
    expect(markup).toContain("rounded-full")
    expect(source).toContain('<HeaderActionsPortal slot="right">')
    expect(source).toContain(
      'ownerId: "workspace-board:team-access-header-action"'
    )
    expect(source).not.toContain("teamAccessCollapsed")
    expect(source).not.toContain("ChevronDownIcon")
  })

  it("keeps loading and error state in the accessible trigger summary", () => {
    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({ loading: true })
    )
    expect(renderAction()).toContain("Checking team access…")
    expect(
      workspaceBoardTeamAccessHoverCardMock.mock.calls[0]?.[0]
    ).toMatchObject({
      organizationAccessLoading: true,
      organizationAccessLoadError: null,
    })

    useWorkspaceBoardOrganizationAccessStateMock.mockReturnValue(
      createOrganizationAccessState({
        loadError: "Unable to load team access.",
      })
    )
    expect(renderAction()).toContain("Team access unavailable right now.")
    expect(
      workspaceBoardTeamAccessHoverCardMock.mock.calls.at(-1)?.[0]
    ).toMatchObject({
      organizationAccessLoading: false,
      organizationAccessLoadError: "Unable to load team access.",
    })
  })
})
