import { describe, expect, it } from "vitest"

import { mapLegacyTrackerStateToObjectiveCollection } from "@/features/workspace-objectives"

describe("workspace-objectives feature contract", () => {
  it("maps legacy tracker state into objective groups/objectives", () => {
    const now = new Date("2026-02-27T00:00:00.000Z")
    const result = mapLegacyTrackerStateToObjectiveCollection({
      orgId: "org-1",
      actorId: "user-1",
      now,
      state: {
        tracker: {
          categories: [
            { id: "general", title: "General", archived: false, createdAt: "2026-02-20T00:00:00.000Z" },
            { id: "fundraising", title: "Fundraising", archived: false, createdAt: "2026-02-21T00:00:00.000Z" },
          ],
          tickets: [
            {
              id: "ticket-1",
              categoryId: "fundraising",
              title: "Draft donor outreach sequence",
              status: "in_progress",
              archived: false,
              createdAt: "2026-02-22T00:00:00.000Z",
              updatedAt: "2026-02-23T00:00:00.000Z",
            },
          ],
        },
      },
    })

    expect(result.loadedFrom).toBe("legacy_tracker")
    expect(result.groups).toHaveLength(2)
    expect(result.objectives).toHaveLength(1)
    expect(result.objectives[0]?.title).toBe("Draft donor outreach sequence")
    expect(result.objectives[0]?.status).toBe("in_progress")
  })
})
