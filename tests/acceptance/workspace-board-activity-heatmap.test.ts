import { describe, expect, it } from "vitest"

import {
  buildWorkspaceBoardActivityHeatmapData,
  WORKSPACE_ACTIVITY_HEATMAP_RANGE_DAYS,
} from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-activity-heatmap-data"
import type { WorkspaceActivityRecord } from "@/app/(dashboard)/my-organization/_components/workspace-board/workspace-board-types"

function buildRecord(
  id: string,
  overrides: Partial<WorkspaceActivityRecord> = {},
): WorkspaceActivityRecord {
  return {
    id,
    source: "communications",
    type: "social_scheduled",
    status: "scheduled",
    title: `Activity ${id}`,
    timestamp: "2026-02-18T15:00:00.000Z",
    description: null,
    ...overrides,
  }
}

describe("workspace board activity heatmap data", () => {
  it("aggregates records by local day and preserves sorted breakdown details", () => {
    const { data, rangeDays } = buildWorkspaceBoardActivityHeatmapData(
      [
        buildRecord("scheduled-1", {
          type: "social_scheduled",
          status: "scheduled",
          timestamp: "2026-02-18T15:00:00.000Z",
        }),
        buildRecord("accelerator-1", {
          source: "accelerator",
          type: "accelerator",
          status: "completed",
          timestamp: "2026-02-18T13:00:00.000Z",
        }),
        buildRecord("older-day", {
          timestamp: "2026-02-17T18:00:00.000Z",
        }),
      ],
      new Date("2026-02-18T12:00:00.000Z"),
    )

    expect(rangeDays).toBe(WORKSPACE_ACTIVITY_HEATMAP_RANGE_DAYS)

    const currentDay = data.find((entry) => entry.date === "2026-02-18")
    expect(currentDay?.value).toBe(2)
    expect(currentDay?.meta?.completedCount).toBe(1)
    expect(currentDay?.meta?.scheduledCount).toBe(1)
    expect(currentDay?.meta?.activities.map((entry) => entry.id)).toEqual([
      "accelerator-1",
      "scheduled-1",
    ])
  })

  it("filters invalid and out-of-window records from the aggregated feed", () => {
    const { data } = buildWorkspaceBoardActivityHeatmapData(
      [
        buildRecord("valid"),
        buildRecord("invalid-time", {
          timestamp: "not-a-date",
        }),
        buildRecord("too-old", {
          timestamp: "2025-02-18T15:00:00.000Z",
        }),
      ],
      new Date("2026-02-18T12:00:00.000Z"),
    )

    expect(data).toHaveLength(1)
    expect(data[0]?.date).toBe("2026-02-18")
    expect(data[0]?.meta?.activities.map((entry) => entry.id)).toEqual(["valid"])
  })
})
