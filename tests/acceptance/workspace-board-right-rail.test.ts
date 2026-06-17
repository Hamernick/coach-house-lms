import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceBoardRightRailContent } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-right-rail"
import type { RoadmapSection } from "@/lib/roadmap"

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

const ROADMAP_SECTION = {
  id: "origin_story",
  title: "Origin Story",
  subtitle: "Why this work exists",
  slug: "origin-story",
  content: "",
  lastUpdated: null,
  isPublic: false,
  layout: "wide",
  status: "in_progress",
  templateTitle: "Origin Story",
  templateSubtitle: "Why this work exists",
  titleIsTemplate: false,
  subtitleIsTemplate: false,
} satisfies RoadmapSection

const COMPLETE_FUNDRAISING_SECTION = {
  ...ROADMAP_SECTION,
  id: "fundraising",
  title: "Fundraising",
  slug: "fundraising",
  status: "complete",
  content: "Fundraising overview is complete.",
  templateTitle: "Fundraising",
  templateSubtitle: "Fundraising approach and priorities.",
} satisfies RoadmapSection

const COMPLETE_FUNDRAISING_STRATEGY_SECTION = {
  ...ROADMAP_SECTION,
  id: "fundraising_strategy",
  title: "Strategy",
  slug: "fundraising-strategy",
  status: "complete",
  content: "Fundraising strategy is complete.",
  templateTitle: "Strategy",
  templateSubtitle: "Funding strategy and target sources.",
} satisfies RoadmapSection

describe("workspace board right rail", () => {
  it("renders team access followed by strategic roadmap while omitting deprecated layout controls", () => {
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
        uiPreferencesScope: {
          orgId: "org-1",
          viewerId: "user-1",
        },
        roadmapSections: [ROADMAP_SECTION],
        tutorialTeamAccessCallout: null,
        onInvitesChange: vi.fn(),
      })
    )

    const teamIndex = markup.indexOf("Team Access")
    const roadmapIndex = markup.indexOf("Strategic Roadmap")

    expect(teamIndex).toBeGreaterThanOrEqual(0)
    expect(roadmapIndex).toBeGreaterThan(teamIndex)
    expect(markup).toContain("Origin Story")
    expect(markup).toContain("pt-10")
    expect(markup).toContain("md:-mt-2")
    expect(markup).toContain("md:pt-0")
    expect(markup).not.toContain("Layout")
    expect(markup).not.toContain("Dagre Tree")
    expect(markup).not.toContain("Linear")
  })

  it("lights completed roadmap child sections in the main workspace rail", () => {
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
        uiPreferencesScope: {
          orgId: "org-1",
          viewerId: "user-1",
        },
        roadmapSections: [
          COMPLETE_FUNDRAISING_SECTION,
          COMPLETE_FUNDRAISING_STRATEGY_SECTION,
        ],
        tutorialTeamAccessCallout: null,
        onInvitesChange: vi.fn(),
      })
    )

    expect(markup).toContain('data-toc-id="fundraising_strategy"')
    expect(markup).toContain('data-status="complete"')
    expect(markup).toContain("Strategy")
    expect(markup).toContain("text-foreground")
  })
})
