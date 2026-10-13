"use client"

import { endOfWeek, format, isAfter, startOfDay, startOfWeek, subDays } from "date-fns"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

export type HeatmapDatum<TMeta = unknown> = {
  date: string | Date
  value: number
  meta?: TMeta
}

export type HeatmapCell<TMeta = unknown> = {
  key: string
  date: Date
  label: string
  value: number
  level: 0 | 1 | 2 | 3 | 4
  isFuture: boolean
  meta: TMeta | null
}

type AxisLabelConfig = {
  showMonths?: boolean
  showWeekdays?: boolean
  weekdayIndices?: number[]
  monthFormat?: "short" | "long" | "numeric"
  minWeekSpacing?: number
}

type LegendConfig = {
  lessLabel?: string
  moreLabel?: string
}

type HeatmapCalendarProps<TMeta = unknown> = {
  title?: string
  data: HeatmapDatum<TMeta>[]
  rangeDays?: number
  endDate?: Date
  weekStartsOn?: 0 | 1
  cellSize?: number
  cellGap?: number
  axisLabels?: boolean | AxisLabelConfig
  legend?: boolean | LegendConfig
  levelClassNames?: [string, string, string, string, string]
  onCellClick?: (cell: HeatmapCell<TMeta>) => void
  renderTooltip?: (cell: HeatmapCell<TMeta>) => ReactNode
  renderLegend?: (args: {
    levels: [0, 1, 2, 3, 4]
    levelClassNames: [string, string, string, string, string]
    lessLabel: string
    moreLabel: string
  }) => ReactNode
  className?: string
}

const DEFAULT_LEVEL_CLASS_NAMES = [
  "border border-border/60 bg-muted/55",
  "border border-border/60 bg-foreground/10",
  "border border-border/70 bg-foreground/20",
  "border border-border/80 bg-foreground/35",
  "border border-foreground/25 bg-foreground/55",
] as const satisfies [string, string, string, string, string]

function toLocalDateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`
}

function parseHeatmapDate(value: string | Date) {
  if (value instanceof Date) {
    return startOfDay(value)
  }

  const trimmed = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number)
    return startOfDay(new Date(year, (month ?? 1) - 1, day ?? 1))
  }

  return startOfDay(new Date(trimmed))
}

function clampHeatmapLevel(value: number, maxValue: number): HeatmapCell["level"] {
  if (value <= 0 || maxValue <= 0) return 0
  const scaled = Math.ceil((value / maxValue) * 4)
  if (scaled <= 1) return 1
  if (scaled === 2) return 2
  if (scaled === 3) return 3
  return 4
}

function resolveWeekdayLabel(dayIndex: number) {
  return format(new Date(2026, 0, dayIndex + 4), "EEE")
}

export function HeatmapCalendar<TMeta = unknown>({
  title,
  data,
  rangeDays = 365,
  endDate = new Date(),
  weekStartsOn = 1,
  cellSize = 12,
  cellGap = 3,
  axisLabels = true,
  legend = true,
  levelClassNames = [...DEFAULT_LEVEL_CLASS_NAMES],
  onCellClick,
  renderTooltip,
  renderLegend,
  className,
}: HeatmapCalendarProps<TMeta>) {
  const resolvedAxisLabels: AxisLabelConfig =
    axisLabels === false
      ? {
          showMonths: false,
          showWeekdays: false,
          weekdayIndices: [],
          monthFormat: "short",
          minWeekSpacing: 3,
        }
      : axisLabels === true
        ? {
            showMonths: true,
            showWeekdays: true,
            weekdayIndices: [1, 3, 5],
            monthFormat: "short",
            minWeekSpacing: 3,
          }
        : {
            showMonths: axisLabels.showMonths ?? true,
            showWeekdays: axisLabels.showWeekdays ?? true,
            weekdayIndices: axisLabels.weekdayIndices ?? [1, 3, 5],
            monthFormat: axisLabels.monthFormat ?? "short",
            minWeekSpacing: axisLabels.minWeekSpacing ?? 3,
          }

  const resolvedLegend: LegendConfig =
    legend === false
      ? {
          lessLabel: "",
          moreLabel: "",
        }
      : legend === true
        ? {
            lessLabel: "Less",
            moreLabel: "More",
          }
        : {
            lessLabel: legend.lessLabel ?? "Less",
            moreLabel: legend.moreLabel ?? "More",
          }

  const alignedEnd = endOfWeek(endDate, { weekStartsOn })
  const alignedStart = startOfWeek(subDays(alignedEnd, rangeDays - 1), {
    weekStartsOn,
  })
  const normalizedData = new Map<string, HeatmapDatum<TMeta>>()

  for (const datum of data) {
    const parsed = parseHeatmapDate(datum.date)
    if (!Number.isFinite(parsed.getTime())) continue
    if (parsed < alignedStart || parsed > alignedEnd) continue
    const key = toLocalDateKey(parsed)
    const existing = normalizedData.get(key)
    if (!existing) {
      normalizedData.set(key, {
        ...datum,
        date: key,
        value: Math.max(0, datum.value),
      })
      continue
    }

    normalizedData.set(key, {
      ...existing,
      value: Math.max(0, existing.value + datum.value),
      meta: datum.meta ?? existing.meta,
    })
  }

  const cells: HeatmapCell<TMeta>[] = []
  let cursor = alignedStart
  let maxValue = 0
  while (cursor <= alignedEnd) {
    const key = toLocalDateKey(cursor)
    const existing = normalizedData.get(key)
    const value = existing?.value ?? 0
    if (value > maxValue) {
      maxValue = value
    }
    cells.push({
      key,
      date: cursor,
      label: format(cursor, "MMM d, yyyy"),
      value,
      level: 0,
      isFuture: isAfter(startOfDay(cursor), startOfDay(new Date())),
      meta: (existing?.meta as TMeta | undefined) ?? null,
    })
    cursor = startOfDay(new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1))
  }

  const leveledCells = cells.map((cell) => ({
    ...cell,
    level: clampHeatmapLevel(cell.value, maxValue),
  }))

  const weeks: HeatmapCell<TMeta>[][] = []
  for (let index = 0; index < leveledCells.length; index += 7) {
    weeks.push(leveledCells.slice(index, index + 7))
  }

  let lastLabeledMonthIndex = -100
  const monthLabels = weeks.map((week, index) => {
    const firstCell = week[0]
    const previousFirstCell = index > 0 ? weeks[index - 1]?.[0] : null
    const monthChanged =
      !previousFirstCell ||
      previousFirstCell.date.getMonth() !== firstCell?.date.getMonth()
    const shouldLabel =
      monthChanged &&
      index - lastLabeledMonthIndex >= (resolvedAxisLabels.minWeekSpacing ?? 3)

    if (shouldLabel) {
      lastLabeledMonthIndex = index
    }

    return {
      key: `month-${firstCell?.key ?? index}`,
      label:
        shouldLabel && firstCell
          ? format(firstCell.date, resolvedAxisLabels.monthFormat === "long"
              ? "MMMM"
              : resolvedAxisLabels.monthFormat === "numeric"
                ? "M"
                : "MMM")
          : "",
    }
  })

  const levels: [0, 1, 2, 3, 4] = [0, 1, 2, 3, 4]

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        {resolvedAxisLabels.showWeekdays ? (
          <div
            className="grid shrink-0 text-[10px] text-muted-foreground"
            style={{
              gridTemplateRows: `repeat(7, ${cellSize}px)`,
              rowGap: cellGap,
              paddingTop: resolvedAxisLabels.showMonths ? cellSize + cellGap : 0,
            }}
          >
            {Array.from({ length: 7 }, (_, index) => (
              <span
                key={`weekday-${index}`}
                className="flex items-center justify-end pr-1"
              >
                {resolvedAxisLabels.weekdayIndices?.includes(index)
                  ? resolveWeekdayLabel(index)
                  : ""}
              </span>
            ))}
          </div>
        ) : null}

        <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
          {resolvedAxisLabels.showMonths ? (
            <div
              className="grid min-w-max text-[10px] text-muted-foreground"
              style={{
                gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
                columnGap: cellGap,
                marginBottom: cellGap,
              }}
            >
              {monthLabels.map((month) => (
                <div key={month.key} className="relative h-3">
                  {month.label ? (
                    <span className="pointer-events-none absolute left-0 top-0 whitespace-nowrap">
                      {month.label}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="grid min-w-max"
            style={{
              gridTemplateColumns: `repeat(${weeks.length}, ${cellSize}px)`,
              columnGap: cellGap,
            }}
          >
            {weeks.map((week) => (
              <div
                key={`week-${week[0]?.key ?? "empty"}`}
                className="grid"
                style={{
                  gridTemplateRows: `repeat(7, ${cellSize}px)`,
                  rowGap: cellGap,
                }}
              >
                {week.map((cell) => {
                  const interactive = cell.value > 0 && (Boolean(renderTooltip) || Boolean(onCellClick))
                  const cellBody = interactive ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "rounded-[4px] p-0 transition-colors hover:opacity-95 focus-visible:ring-2 focus-visible:ring-ring/60",
                        levelClassNames[cell.level],
                        cell.isFuture && "opacity-35",
                      )}
                      style={{ height: cellSize, width: cellSize }}
                      onClick={() => onCellClick?.(cell)}
                      aria-label={`${cell.label} with ${cell.value} item${cell.value === 1 ? "" : "s"}`}
                    />
                  ) : (
                    <div
                      className={cn(
                        "rounded-[4px]",
                        levelClassNames[cell.level],
                        cell.isFuture && "opacity-35",
                      )}
                      style={{ height: cellSize, width: cellSize }}
                      aria-hidden
                    />
                  )

                  if (interactive && renderTooltip) {
                    return (
                      <HoverCard
                        key={cell.key}
                        openDelay={120}
                        closeDelay={100}
                      >
                        <HoverCardTrigger asChild>{cellBody}</HoverCardTrigger>
                        <HoverCardContent
                          side="top"
                          align="start"
                          sideOffset={10}
                          className="w-[20rem] max-w-[calc(100vw-2rem)] whitespace-normal"
                        >
                          {renderTooltip(cell)}
                        </HoverCardContent>
                      </HoverCard>
                    )
                  }

                  return <div key={cell.key}>{cellBody}</div>
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {legend !== false ? (
        renderLegend ? (
          renderLegend({
            levels,
            levelClassNames,
            lessLabel: resolvedLegend.lessLabel ?? "Less",
            moreLabel: resolvedLegend.moreLabel ?? "More",
          })
        ) : (
          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
            <span>{resolvedLegend.lessLabel}</span>
            <div className="flex items-center gap-1">
              {levels.map((level) => (
                <span
                  key={`legend-${level}`}
                  className={cn("rounded-[4px]", levelClassNames[level])}
                  style={{ height: cellSize, width: cellSize }}
                  aria-hidden
                />
              ))}
            </div>
            <span>{resolvedLegend.moreLabel}</span>
          </div>
        )
      ) : null}
    </div>
  )
}
