import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAccessPeople,
  countActiveWorkspaceInvites,
  shouldShowWorkspaceTeamAccessEmptyState,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-team-access"

describe("workspace board team access", () => {
  it("deduplicates the current user against the owner membership row", () => {
    const people = buildWorkspaceAccessPeople({
      currentUser: {
        id: "org-1",
        name: "Bright Futures Collective",
        avatarUrl: null,
      },
      members: [
        {
          userId: "org-1",
          name: "Bright Futures Collective",
          email: "owner@example.com",
          avatarUrl: null,
          role: "owner",
          isOwner: true,
        },
      ],
    })

    expect(people).toHaveLength(1)
    expect(people[0]).toMatchObject({
      id: "org-1",
      subtitle: "You",
    })
  })

  it("shows the empty state only for a solo workspace with no active invites", () => {
    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 1,
        activeInviteCount: 0,
      }),
    ).toBe(true)

    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 2,
        activeInviteCount: 0,
      }),
    ).toBe(false)

    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 1,
        activeInviteCount: 1,
      }),
    ).toBe(false)
  })

  it("counts only non-revoked invites that have not expired", () => {
    const nowMs = new Date("2026-03-08T14:00:00.000Z").getTime()

    const count = countActiveWorkspaceInvites(
      [
        {
          id: "invite-active",
          userId: "member-1",
          userName: null,
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-03-08T13:00:00.000Z",
          expiresAt: "2026-03-08T15:00:00.000Z",
          revokedAt: null,
          durationValue: 2,
          durationUnit: "hours",
        },
        {
          id: "invite-expired",
          userId: "member-2",
          userName: null,
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-03-08T11:00:00.000Z",
          expiresAt: "2026-03-08T12:00:00.000Z",
          revokedAt: null,
          durationValue: 1,
          durationUnit: "hours",
        },
        {
          id: "invite-revoked",
          userId: "member-3",
          userName: null,
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-03-08T13:00:00.000Z",
          expiresAt: "2026-03-08T16:00:00.000Z",
          revokedAt: "2026-03-08T13:30:00.000Z",
          durationValue: 3,
          durationUnit: "hours",
        },
      ],
      nowMs,
    )

    expect(count).toBe(1)
  })
})
