import { describe, expect, it } from "vitest"

import {
  resolveMemberWorkspaceOrganizationHref,
} from "@/features/member-workspace/components/projects/member-workspace-project-organization-card"
import type { MemberWorkspaceAdminOrganizationSummary } from "@/features/member-workspace/types"

function buildOrganizationSummary(
  overrides: Partial<MemberWorkspaceAdminOrganizationSummary> = {},
): MemberWorkspaceAdminOrganizationSummary {
  return {
    orgId: "org-1",
    canonicalProjectId: null,
    name: "Community Builders",
    ownerName: "Paula Founder",
    ownerAvatarUrl: null,
    publicSlug: "community-builders",
    organizationStatus: "approved",
    isPublic: true,
    createdAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-20T00:00:00.000Z",
    acceleratorProgress: 62,
    setupProgress: 75,
    setupCompletedCount: 3,
    setupTotalCount: 4,
    missingSetupCount: 1,
    memberCount: 1,
    tags: ["organization"],
    members: [],
    setupItems: [],
    profile: {},
    ...overrides,
  }
}

describe("member workspace organization card", () => {
  it("falls back to the public Find profile when no external site is configured", () => {
    expect(resolveMemberWorkspaceOrganizationHref(buildOrganizationSummary())).toBe(
      "/find/community-builders",
    )
  })

  it("normalizes bare external website domains before opening them", () => {
    expect(
      resolveMemberWorkspaceOrganizationHref(
        buildOrganizationSummary({
          profile: {
            website: "communitybuilders.org",
          },
        }),
      ),
    ).toBe("https://communitybuilders.org")
  })
})
