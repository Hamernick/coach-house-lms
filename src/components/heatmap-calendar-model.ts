import { endOfWeek, format, isAfter, startOfDay, startOfWeek, subDays } from "date-fns"

import type {
  AxisLabelConfig,
  HeatmapCell,
  HeatmapDatum,
  LegendConfig,
} from "@/components/heatmap-calendar-types"

export const DEFAULT_LEVEL_CLASS_NAMES = [
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

export function resolveWeekdayLabel(dayIndex: number) {
  return format(new Date(2026, 0, dayIndex + 4), "EEE")
}

export function resolveHeatmapAxisLabels(
  axisLabels: boolean | AxisLabelConfig,
): Required<AxisLabelConfig> {
  if (axisLabels === false) {
    return {
      showMonths: false,
      showWeekdays: false,
      weekdayIndices: [],
      monthFormat: "short",
      minWeekSpacing: 3,
    }
  }

  if (axisLabels === true) {
    return {
      showMonths: true,
      showWeekdays: true,
      weekdayIndices: [1, 3, 5],
      monthFormat: "short",
      minWeekSpacing: 3,
    }
  }

  return {
    showMonths: axisLabels.showMonths ?? true,
    showWeekdays: axisLabels.showWeekdays ?? true,
    weekdayIndices: axisLabels.weekdayIndices ?? [1, 3, 5],
    monthFormat: axisLabels.monthFormat ?? "short",
    minWeekSpacing: axisLabels.minWeekSpacing ?? 3,
  }
}

export function resolveHeatmapLegend(
  legend: boolean | LegendConfig,
): Required<LegendConfig> {
  if (legend === false) {
    return { lessLabel: "", moreLabel: "" }
  }

  if (legend === true) {
    return { lessLabel: "Less", moreLabel: "More" }
  }

  return {
    lessLabel: legend.lessLabel ?? "Less",
    moreLabel: legend.moreLabel ?? "More",
  }
}

function normalizeHeatmapData<TMeta>({
  alignedEnd,
  alignedStart,
  data,
}: {
  alignedEnd: Date
  alignedStart: Date
  data: HeatmapDatum<TMeta>[]
}) {
  const normalizedData = new Map<string, HeatmapDatum<TMeta>>()

  for (const datum of data) {
    const parsed = parseHeatmapDate(datum.date)
    if (!Number.isFinite(parsed.getTime())) continue
    if (parsed < alignedStart || parsed > alignedEnd) continue
    const key = toLocalDateKey(parsed)
    const existing = normalizedData.get(key)
    normalizedData.set(key, {
      ...(existing ?? datum),
      date: key,
      value: Math.max(0, (existing?.value ?? 0) + datum.value),
      meta: datum.meta ?? existing?.meta,
    })
  }

  return normalizedData
}

function buildHeatmapCells<TMeta>({
  alignedEnd,
  alignedStart,
  normalizedData,
}: {
  alignedEnd: Date
  alignedStart: Date
  normalizedData: Map<string, HeatmapDatum<TMeta>>
}) {
  const cells: HeatmapCell<TMeta>[] = []
  let cursor = alignedStart
  let maxValue = 0

  while (cursor <= alignedEnd) {
    const key = toLocalDateKey(cursor)
    const existing = normalizedData.get(key)
    const value = existing?.value ?? 0
    maxValue = Math.max(maxValue, value)
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

  return cells.map((cell) => ({
    ...cell,
    level: clampHeatmapLevel(cell.value, maxValue),
  }))
}

function buildMonthLabels<TMeta>({
  axisLabels,
  weeks,
}: {
  axisLabels: Required<AxisLabelConfig>
  weeks: HeatmapCell<TMeta>[][]
}) {
  let lastLabeledMonthIndex = -100

  return weeks.map((week, index) => {
    const firstCell = week[0]
    const previousFirstCell = index > 0 ? weeks[index - 1]?.[0] : null
    const monthChanged =
      !previousFirstCell ||
      previousFirstCell.date.getMonth() !== firstCell?.date.getMonth()
    const shouldLabel =
      monthChanged && index - lastLabeledMonthIndex >= axisLabels.minWeekSpacing

    if (shouldLabel) {
      lastLabeledMonthIndex = index
    }

    return {
      key: `month-${firstCell?.key ?? index}`,
      label:
        shouldLabel && firstCell
          ? format(
              firstCell.date,
              axisLabels.monthFormat === "long"
                ? "MMMM"
                : axisLabels.monthFormat === "numeric"
                  ? "M"
                  : "MMM",
            )
          : "",
    }
  })
}

export function buildHeatmapCalendarModel<TMeta>({
  axisLabels,
  data,
  endDate,
  rangeDays,
  weekStartsOn,
}: {
  axisLabels: Required<AxisLabelConfig>
  data: HeatmapDatum<TMeta>[]
  endDate: Date
  rangeDays: number
  weekStartsOn: 0 | 1
}) {
  const alignedEnd = endOfWeek(endDate, { weekStartsOn })
  const alignedStart = startOfWeek(subDays(alignedEnd, rangeDays - 1), {
    weekStartsOn,
  })
  const normalizedData = normalizeHeatmapData({ alignedEnd, alignedStart, data })
  const leveledCells = buildHeatmapCells({ alignedEnd, alignedStart, normalizedData })
  const weeks: HeatmapCell<TMeta>[][] = []

  for (let index = 0; index < leveledCells.length; index += 7) {
    weeks.push(leveledCells.slice(index, index + 7))
  }

  return {
    monthLabels: buildMonthLabels({ axisLabels, weeks }),
    weeks,
  }
}
