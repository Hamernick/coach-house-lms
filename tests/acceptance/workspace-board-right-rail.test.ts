import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceBoardRightRailContent } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-right-rail"

describe("workspace board right rail", () => {
  it("keeps team access while omitting the deprecated layout controls", () => {
    const markup = renderToStaticMarkup(
      React.createElement(WorkspaceBoardRightRailContent, {
        canInvite: true,
        members: [],
        invites: [],
        realtimeState: "live",
        currentUser: {
          id: "user-1",
          name: "Caleb Hamernick",
          avatarUrl: null,
        },
        tutorialTeamAccessCallout: null,
        onInvitesChange: vi.fn(),
      }),
    )

    expect(markup).toContain("Team Access")
    expect(markup).toContain("-mt-2")
    expect(markup).not.toContain("Layout")
    expect(markup).not.toContain("Dagre Tree")
    expect(markup).not.toContain("Linear")
  })
})
