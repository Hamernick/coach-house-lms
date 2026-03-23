import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCollaborationInviteNotificationMetadata,
  listWorkspaceCoachInviteShortcuts,
  readWorkspaceCollaborationInviteNotificationMetadata,
} from "@/app/(dashboard)/my-organization/_lib/workspace-collaboration-invite-helpers"

describe("workspace collaboration invite helpers", () => {
  it("exposes the Joel and Paula coach shortcuts", () => {
    expect(listWorkspaceCoachInviteShortcuts().map((shortcut) => shortcut.id)).toEqual([
      "coach:joel",
      "coach:paula",
    ])
  })

  it("round-trips workspace invite notification metadata", () => {
    const metadata = buildWorkspaceCollaborationInviteNotificationMetadata({
      inviteId: "invite-123",
      orgId: "org-456",
      organizationName: "South Side Youth Alliance",
      inviterName: "Caleb Hamernick",
      inviteeName: "Joel Hamernick",
      expiresAt: "2026-03-20T15:00:00.000Z",
    })

    expect(readWorkspaceCollaborationInviteNotificationMetadata(metadata)).toEqual(
      metadata,
    )
  })

  it("rejects malformed workspace invite notification metadata", () => {
    expect(
      readWorkspaceCollaborationInviteNotificationMetadata({
        inviteId: "",
        orgId: "org-456",
        organizationName: "Coach House",
      }),
    ).toBeNull()
  })
})
