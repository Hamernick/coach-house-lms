import { readFileSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { mapUpcomingEvents } from "@/app/(dashboard)/my-organization/_lib/upcoming-events"

function readSource(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), "utf8")
}

describe("roadmap calendar concurrency", () => {
  it("carries the loaded event revision through workspace calendar payloads", () => {
    const [event] = mapUpcomingEvents([
      {
        id: "event-1",
        title: "Board meeting",
        description: null,
        event_type: "board_meeting",
        starts_at: "2026-08-12T16:00:00.000Z",
        ends_at: "2026-08-12T17:00:00.000Z",
        all_day: false,
        recurrence: null,
        status: "active",
        assigned_roles: ["board"],
        updated_at: "2026-08-05T19:55:00.000Z",
      },
    ])

    expect(event?.updated_at).toBe("2026-08-05T19:55:00.000Z")
  })

  it("guards both calendar editors and the server update with the loaded revision", () => {
    const calendarTypes = readSource("src/lib/roadmap/calendar.ts")
    const action = readSource("src/actions/roadmap-calendar.ts")
    const calendarEditor = readSource(
      "src/components/roadmap/roadmap-calendar.tsx"
    )
    const workspaceEditor = readSource(
      "src/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-calendar-event-sheet.tsx"
    )
    const workspaceLoader = readSource(
      "src/app/(dashboard)/my-organization/_lib/my-organization-page-content.tsx"
    )

    expect(calendarTypes).toContain("expectedUpdatedAt?: string")
    expect(calendarEditor).toContain(
      "expectedUpdatedAt: editingEvent.updatedAt"
    )
    expect(workspaceEditor).toContain("expectedUpdatedAt: event.updated_at")
    expect(workspaceLoader).toContain("assigned_roles,updated_at")
    expect(action).toContain(
      "updates.expectedUpdatedAt !== existing.updated_at"
    )
    expect(action).toContain('.eq("updated_at", existing.updated_at)')
    expect(
      action.match(
        /This calendar event was updated elsewhere\. Reload before saving\./g
      ) ?? []
    ).toHaveLength(2)
  })
})
