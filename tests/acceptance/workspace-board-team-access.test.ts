import { describe, expect, it } from "vitest"

import {
  buildWorkspaceAccessPeople,
  countPendingWorkspaceTeamAccess,
  countActiveWorkspaceInvites,
  listPendingWorkspaceAccessRequests,
  listPendingWorkspaceTeamInvites,
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
        pendingTeamAccessCount: 0,
      }),
    ).toBe(true)

    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 2,
        activeInviteCount: 0,
        pendingTeamAccessCount: 0,
      }),
    ).toBe(false)

    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 1,
        activeInviteCount: 1,
        pendingTeamAccessCount: 0,
      }),
    ).toBe(false)

    expect(
      shouldShowWorkspaceTeamAccessEmptyState({
        accessPeopleCount: 1,
        activeInviteCount: 0,
        pendingTeamAccessCount: 1,
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

  it("counts only pending organization invites and access requests", () => {
    const nowMs = new Date("2026-04-06T18:00:00.000Z").getTime()

    expect(
      listPendingWorkspaceTeamInvites(
        [
          {
            id: "invite-pending",
            email: "pending@example.com",
            role: "board",
            inviteKind: "standard",
            token: "token-1",
            expiresAt: "2026-04-07T18:00:00.000Z",
            createdAt: "2026-04-06T16:00:00.000Z",
            acceptedAt: null,
          },
          {
            id: "invite-accepted",
            email: "accepted@example.com",
            role: "staff",
            inviteKind: "standard",
            token: "token-2",
            expiresAt: "2026-04-07T18:00:00.000Z",
            createdAt: "2026-04-06T16:00:00.000Z",
            acceptedAt: "2026-04-06T17:00:00.000Z",
          },
          {
            id: "invite-expired",
            email: "expired@example.com",
            role: "board",
            inviteKind: "standard",
            token: "token-3",
            expiresAt: "2026-04-06T17:00:00.000Z",
            createdAt: "2026-04-06T15:00:00.000Z",
            acceptedAt: null,
          },
        ],
        nowMs,
      ),
    ).toHaveLength(1)

    expect(
      listPendingWorkspaceAccessRequests(
        [
          {
            id: "request-pending",
            orgId: "org-1",
            organizationName: "Bright Futures",
            inviteeUserId: "user-1",
            inviteeEmail: "pending@example.com",
            inviteeName: "Pending User",
            inviterUserId: "owner-1",
            inviterName: "Owner",
            role: "staff",
            status: "pending",
            message: null,
            createdAt: "2026-04-06T16:00:00.000Z",
            respondedAt: null,
            expiresAt: "2026-04-07T18:00:00.000Z",
          },
          {
            id: "request-declined",
            orgId: "org-1",
            organizationName: "Bright Futures",
            inviteeUserId: "user-2",
            inviteeEmail: "declined@example.com",
            inviteeName: "Declined User",
            inviterUserId: "owner-1",
            inviterName: "Owner",
            role: "board",
            status: "declined",
            message: null,
            createdAt: "2026-04-06T16:00:00.000Z",
            respondedAt: "2026-04-06T17:00:00.000Z",
            expiresAt: "2026-04-07T18:00:00.000Z",
          },
          {
            id: "request-expired",
            orgId: "org-1",
            organizationName: "Bright Futures",
            inviteeUserId: "user-3",
            inviteeEmail: "expired@example.com",
            inviteeName: "Expired User",
            inviterUserId: "owner-1",
            inviterName: "Owner",
            role: "board",
            status: "pending",
            message: null,
            createdAt: "2026-04-06T16:00:00.000Z",
            respondedAt: null,
            expiresAt: "2026-04-06T17:00:00.000Z",
          },
        ],
        nowMs,
      ),
    ).toHaveLength(1)

    expect(
      countPendingWorkspaceTeamAccess({
        invites: [
          {
            id: "invite-pending",
            email: "pending@example.com",
            role: "board",
            inviteKind: "standard",
            token: "token-1",
            expiresAt: "2026-04-07T18:00:00.000Z",
            createdAt: "2026-04-06T16:00:00.000Z",
            acceptedAt: null,
          },
        ],
        requests: [
          {
            id: "request-pending",
            orgId: "org-1",
            organizationName: "Bright Futures",
            inviteeUserId: "user-1",
            inviteeEmail: "pending@example.com",
            inviteeName: "Pending User",
            inviterUserId: "owner-1",
            inviterName: "Owner",
            role: "staff",
            status: "pending",
            message: null,
            createdAt: "2026-04-06T16:00:00.000Z",
            respondedAt: null,
            expiresAt: "2026-04-07T18:00:00.000Z",
          },
        ],
        nowMs,
      }),
    ).toBe(2)
  })
})
