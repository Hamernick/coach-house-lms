import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { createClient } = vi.hoisted(() => ({ createClient: vi.fn() }))
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: createClient }))

import {
  listNotificationsAction,
  markAllNotificationsReadAction,
} from "@/app/actions/notifications"

const assignment = {
  id: "assignment-1",
  user_id: "viewer",
  title: "Task assigned to you",
  description: "A task was assigned.",
  href: "/tasks",
  tone: "info",
  created_at: "2026-10-03T18:00:00.000Z",
  read_at: null as string | null,
  archived_at: null,
  type: "task_assigned",
  metadata: null,
}

function mockInbox(rows = [assignment], userId: string | null = "viewer") {
  const filters: Array<(row: typeof assignment) => boolean> = []
  let update: { read_at: string } | undefined
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn((key: keyof typeof assignment, value: unknown) => {
      filters.push((row) => row[key] === value)
      return query
    }),
    is: vi.fn((key: keyof typeof assignment, value: unknown) => {
      filters.push((row) => row[key] === value)
      return query
    }),
    in: vi.fn((key: keyof typeof assignment, values: unknown[]) => {
      filters.push((row) => values.includes(row[key]))
      return query
    }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    update: vi.fn((value: { read_at: string }) => {
      update = value
      return query
    }),
    returns: vi.fn(async () => ({ data: rows.filter((row) => filters.every((filter) => filter(row))), error: null })),
    then(resolve: (result: { error: null }) => void) {
      for (const row of rows.filter((row) => filters.every((filter) => filter(row)))) {
        Object.assign(row, update)
      }
      resolve({ error: null })
    },
  }
  const from = vi.fn(() => query)
  createClient.mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null }, error: null }) },
    from,
  })
  return { from, query }
}

beforeEach(() => vi.clearAllMocks())
afterEach(() => vi.unstubAllEnvs())

describe("notification inbox", () => {
  it("returns only saved notices with their unread state when platform tools are unconfigured", async () => {
    vi.stubEnv("SUPABASE_MANAGEMENT_API_TOKEN", "")
    const { from } = mockInbox()
    const result = await listNotificationsAction()
    expect(result).toMatchObject({ ok: true, inbox: [{ id: assignment.id, type: "task_assigned", readAt: null }] })
    expect("inbox" in result && result.inbox).toHaveLength(1)
    expect(from).toHaveBeenCalledExactlyOnceWith("notifications")
  })

  it("does not manufacture unread notices on repeated empty inbox loads", async () => {
    vi.stubEnv("SUPABASE_MANAGEMENT_API_TOKEN", "")
    mockInbox([])
    expect(await listNotificationsAction()).toEqual({ ok: true, inbox: [] })
    expect(await listNotificationsAction()).toEqual({ ok: true, inbox: [] })
  })

  it("preserves a saved read timestamp", async () => {
    const readAt = "2026-10-03T18:05:00.000Z"
    mockInbox([{ ...assignment, read_at: readAt }])
    expect(await listNotificationsAction()).toMatchObject({ inbox: [{ readAt }] })
  })

  it("marks only loaded notices belonging to the viewer read, leaving new arrivals unread", async () => {
    const rows = [
      { ...assignment },
      { ...assignment, id: "arrived-after-refresh" },
      { ...assignment, id: "another-users-notice", user_id: "someone-else" },
    ]
    mockInbox(rows)
    expect(await markAllNotificationsReadAction([assignment.id, "another-users-notice"])).toEqual({ ok: true })
    expect(rows[0].read_at).toEqual(expect.any(String))
    expect(rows[1].read_at).toBeNull()
    expect(rows[2].read_at).toBeNull()
  })

  it("requires authentication for a nonempty selection", async () => {
    const { from } = mockInbox([], null)
    expect(await markAllNotificationsReadAction([assignment.id])).toEqual({ error: "Not authenticated." })
    expect(from).not.toHaveBeenCalled()
  })

  it("does not fall back to clearing the entire inbox for an empty or oversized selection", async () => {
    expect(await markAllNotificationsReadAction([])).toEqual({ ok: true })
    expect(await markAllNotificationsReadAction(Array(51).fill(assignment.id))).toEqual({ error: "Invalid notification selection." })
    expect(createClient).not.toHaveBeenCalled()
  })
})
