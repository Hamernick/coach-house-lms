"use client"

import { Fragment } from "react"

import type { EmailOpsHeatmapPoint } from "../types"

function resolveHeatmapTone(value: number) {
  if (value >= 72) return "bg-emerald-500/80"
  if (value >= 52) return "bg-sky-500/65"
  if (value >= 32) return "bg-amber-500/55"
  return "bg-muted"
}

export function EmailOpsHeatmap({
  points,
}: {
  points: EmailOpsHeatmapPoint[]
}) {
  const days = Array.from(new Set(points.map((point) => point.dayLabel)))
  const hours = Array.from(new Set(points.map((point) => point.hourLabel)))
  const pointsByKey = new Map(
    points.map((point) => [`${point.dayLabel}:${point.hourLabel}`, point])
  )

  return (
    <div className="grid gap-2">
      <div
        className="grid gap-1.5"
        style={{
          gridTemplateColumns: `2.25rem repeat(${hours.length}, minmax(1.5rem, 1fr))`,
        }}
      >
        <span aria-hidden />
        {hours.map((hour) => (
          <span
            key={hour}
            className="text-center text-[10px] font-medium text-muted-foreground"
          >
            {hour}
          </span>
        ))}
        {days.map((day) => (
          <Fragment key={day}>
            <span
              className="flex items-center text-[10px] font-medium text-muted-foreground"
            >
              {day}
            </span>
            {hours.map((hour) => {
              const point = pointsByKey.get(`${day}:${hour}`)
              const value = point?.value ?? 0

              return (
                <span
                  key={`${day}-${hour}`}
                  className={`h-6 rounded-md border border-border/50 ${resolveHeatmapTone(
                    value
                  )}`}
                  title={`${day} ${hour}: ${value}% engagement fit`}
                />
              )
            })}
          </Fragment>
        ))}
      </div>
    </div>
  )
}
