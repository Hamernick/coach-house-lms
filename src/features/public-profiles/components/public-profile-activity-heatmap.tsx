"use client"

import {
  CalendarHeatmap,
  CalendarHeatmapBlock,
  CalendarHeatmapBody,
  CalendarHeatmapFooter,
  CalendarHeatmapLegend,
  CalendarHeatmapStat,
} from "@/components/heatmap/calendar-heatmap"
import type { PublicProfileHeatmapDay } from "../types"

export function PublicProfileActivityHeatmap({
  data,
}: {
  data: PublicProfileHeatmapDay[]
}) {
  const total = data.reduce((sum, day) => sum + day.value, 0)
  if (total === 0) return null

  return (
    <CalendarHeatmap
      data={data}
      weekStart={1}
      continuousMonths
      blockSize={11}
      blockMargin={3}
      blockRadius={2}
      totalCount={total}
      labels={{
        cellLabel: "{{date}}: {{value}} public activities",
        heatmapLabel: "Public activity heatmap for {{year}}",
        legendLabel: "Public activity intensity",
        legendLevelLabel: "Level {{level}} public activity",
        stat: "{{value}} public activities",
      }}
      className="w-full p-0"
    >
      <CalendarHeatmapBody hideYearLabels>
        {({ activity, dayIndex, weekIndex }) => (
          <CalendarHeatmapBlock
            activity={activity}
            dayIndex={dayIndex}
            weekIndex={weekIndex}
          />
        )}
      </CalendarHeatmapBody>
      <CalendarHeatmapFooter>
        <CalendarHeatmapStat />
        <CalendarHeatmapLegend />
      </CalendarHeatmapFooter>
    </CalendarHeatmap>
  )
}
