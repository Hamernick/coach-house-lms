import { describe, expect, it } from "vitest"

import {
  buildWorkspaceCommunicationActivityByDayFromPosts,
  filterActiveWorkspaceInvites,
  readWorkspaceBoardStateValue,
  readWorkspaceCommunicationChannelConnectionsFromRows,
  readWorkspaceCommunicationPostsFromRows,
  readWorkspaceCollaborationInvitesFromRows,
} from "@/app/(dashboard)/my-organization/_lib/workspace-state"
import {
  buildWorkspaceActivityFeed,
  mergeWorkspaceActivityFeeds,
} from "@/app/(dashboard)/my-organization/_lib/workspace-activity"
import { readWorkspaceCommunicationDeliveryTasksFromRows } from "@/app/(dashboard)/my-organization/_lib/workspace-communications-delivery"

describe("workspace storage adapters", () => {
  it("normalizes database invite rows into workspace invite objects", () => {
    const invites = readWorkspaceCollaborationInvitesFromRows([
      {
        id: "invite-1",
        user_id: "user-1",
        user_name: "Alex",
        user_email: "alex@example.com",
        created_by: "owner-1",
        created_at: "2026-02-22T00:00:00.000Z",
        expires_at: "2026-02-23T00:00:00.000Z",
        revoked_at: null,
        duration_value: 24,
        duration_unit: "hours",
      },
    ])

    expect(invites).toHaveLength(1)
    expect(invites[0]?.id).toBe("invite-1")
    expect(invites[0]?.userId).toBe("user-1")
    expect(invites[0]?.durationValue).toBe(12)
  })

  it("filters expired and revoked rows from active invites", () => {
    const active = filterActiveWorkspaceInvites(
      [
        {
          id: "invite-1",
          userId: "user-1",
          userName: "Active Invite",
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-02-22T00:00:00.000Z",
          expiresAt: "2026-02-25T00:00:00.000Z",
          revokedAt: null,
          durationValue: 2,
          durationUnit: "days",
        },
        {
          id: "invite-2",
          userId: "user-2",
          userName: "Revoked Invite",
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-02-21T00:00:00.000Z",
          expiresAt: "2026-02-25T00:00:00.000Z",
          revokedAt: "2026-02-22T01:00:00.000Z",
          durationValue: 1,
          durationUnit: "days",
        },
        {
          id: "invite-3",
          userId: "user-3",
          userName: "Expired Invite",
          userEmail: null,
          createdBy: "owner-1",
          createdAt: "2026-02-21T00:00:00.000Z",
          expiresAt: "2026-02-22T12:00:00.000Z",
          revokedAt: null,
          durationValue: 1,
          durationUnit: "days",
        },
      ],
      "2026-02-22T13:00:00.000Z",
    )

    expect(active).toHaveLength(1)
    expect(active[0]?.id).toBe("invite-1")
  })

  it("falls back to default board state when value is missing", () => {
    const state = readWorkspaceBoardStateValue(null)
    expect(state.nodes.length).toBeGreaterThan(0)
    expect(state.preset).toBe("balanced")
    expect(state.communications.channel).toBe("social")
  })

  it("derives communications activity map from persisted posts", () => {
    const posts = readWorkspaceCommunicationPostsFromRows([
      {
        id: "post-1",
        channel: "social",
        media_mode: "text",
        content: "Scheduled update",
        status: "scheduled",
        scheduled_for: "2026-02-25T15:00:00.000Z",
        posted_at: null,
        created_by: "staff-1",
        created_at: "2026-02-24T10:00:00.000Z",
      },
      {
        id: "post-2",
        channel: "email",
        media_mode: "image",
        content: "Published board update",
        status: "posted",
        scheduled_for: "2026-02-25T16:00:00.000Z",
        posted_at: "2026-02-25T16:05:00.000Z",
        created_by: "staff-1",
        created_at: "2026-02-24T11:00:00.000Z",
      },
    ])

    const activityByDay = buildWorkspaceCommunicationActivityByDayFromPosts(posts)
    expect(activityByDay["2026-02-25"]?.status).toBe("posted")
    expect(activityByDay["2026-02-25"]?.channel).toBe("email")
  })

  it("builds a shared workspace activity feed across communications, calendar, and accelerator", () => {
    const posts = readWorkspaceCommunicationPostsFromRows([
      {
        id: "post-1",
        channel: "social",
        media_mode: "text",
        content: "Scheduled update",
        status: "scheduled",
        scheduled_for: "2026-02-25T15:00:00.000Z",
        posted_at: null,
        created_by: "staff-1",
        created_at: "2026-02-24T10:00:00.000Z",
      },
    ])

    const feed = buildWorkspaceActivityFeed({
      communicationPosts: posts,
      calendarEvents: [
        {
          id: "event-1",
          title: "Board meeting",
          description: null,
          event_type: "board_meeting",
          starts_at: "2026-02-26T18:00:00.000Z",
          status: "active",
        },
      ],
      acceleratorProgress: [
        {
          module_id: "module-1",
          status: "completed",
          completed_at: "2026-02-24T17:30:00.000Z",
          updated_at: "2026-02-24T17:30:00.000Z",
        },
      ],
      acceleratorTimeline: [
        {
          id: "step-1",
          moduleId: "module-1",
          moduleTitle: "Launch your first campaign",
          stepKind: "video",
          stepTitle: "Video",
          stepDescription: null,
          href: "/accelerator/step-1",
          status: "completed",
          stepSequenceIndex: 0,
          stepSequenceTotal: 1,
          moduleSequenceIndex: 0,
          moduleSequenceTotal: 1,
          groupTitle: "Foundations",
          videoUrl: null,
          durationMinutes: null,
          resources: [],
          hasAssignment: false,
          hasDeck: false,
        },
      ],
    })

    expect(feed.map((entry) => entry.type)).toEqual([
      "calendar_board_meeting",
      "social_scheduled",
      "accelerator",
    ])
  })

  it("deduplicates identical activity overlays when feeds merge", () => {
    const base = [
      {
        id: "communication:post-1",
        source: "communications" as const,
        type: "social_posted" as const,
        status: "completed" as const,
        title: "Email post published",
        timestamp: "2026-02-25T16:05:00.000Z",
      },
    ]

    const merged = mergeWorkspaceActivityFeeds(base, [...base])
    expect(merged).toHaveLength(1)
  })

  it("normalizes delivery queue rows into delivery task objects", () => {
    const tasks = readWorkspaceCommunicationDeliveryTasksFromRows([
      {
        id: "delivery-1",
        org_id: "org-1",
        communication_id: "post-1",
        channel: "social",
        status: "queued",
        provider: "mock",
        attempt_count: 0,
        last_error: null,
        payload: { mediaMode: "text" },
        queued_at: "2026-02-25T10:00:00.000Z",
        sent_at: null,
        created_by: "staff-1",
        created_at: "2026-02-25T10:00:00.000Z",
      },
    ])

    expect(tasks).toHaveLength(1)
    expect(tasks[0]?.channel).toBe("social")
    expect(tasks[0]?.status).toBe("queued")
    expect(tasks[0]?.payload.mediaMode).toBe("text")
  })

  it("normalizes communication channel connection rows with defaults", () => {
    const connections = readWorkspaceCommunicationChannelConnectionsFromRows([
      {
        org_id: "org-1",
        channel: "social",
        is_connected: true,
        provider: "mock-social",
        connected_by: "staff-1",
        connected_at: "2026-02-25T10:00:00.000Z",
      },
    ])

    expect(connections.social.connected).toBe(true)
    expect(connections.social.provider).toBe("mock-social")
    expect(connections.email.connected).toBe(false)
    expect(connections.blog.connected).toBe(false)
  })
})
