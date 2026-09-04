import type { Locale, Day as WeekDay } from "date-fns"
import { getYear, parseISO } from "date-fns"
import type { CSSProperties, HTMLAttributes, ReactNode } from "react"
import { createContext, use, useMemo } from "react"

import { cn } from "@/lib/utils"
import {
  calculateLevel,
  generateMonthLabels,
  generateWeekdayLabels,
  groupByYearAndMonth,
  groupContinuous,
  type Activity,
  type ActivityWithLevel,
  type ColorConfig,
  type Labels,
  type Week,
  type YearRow,
} from "./calendar-heatmap-model"

type CalendarHeatmapContextType = {
  data: ActivityWithLevel[]
  weeks: Week[]
  yearRows: YearRow[]
  blockMargin: number
  blockRadius: number
  blockSize: number
  blockAspectRatio: number
  blockWidth: number
  fontSize: number
  labels: Labels
  labelHeight: number
  levels: number
  isNormalized: boolean
  totalCount: number
  weekStart: WeekDay
  year: number
  width: number
  height: number
  hasEmptyColumn: boolean
  continuousMonths: boolean
  locale?: Locale
  colors?: ColorConfig
}

const EMPTY_STYLE: CSSProperties = {}
const LABEL_MARGIN = 8

const CalendarHeatmapContext = createContext<CalendarHeatmapContextType | null>(
  null
)

export const useCalendarHeatmap = () => {
  const context = use(CalendarHeatmapContext)

  if (!context) {
    throw new Error(
      "CalendarHeatmap components must be used within a CalendarHeatmap"
    )
  }

  return context
}

export type CalendarHeatmapProps = HTMLAttributes<HTMLDivElement> & {
  data: Activity[]
  weekStart?: WeekDay
  continuousMonths?: boolean
  hasEmptyColumn?: boolean
  blockSize?: number
  blockMargin?: number
  blockRadius?: number
  blockAspectRatio?: number
  levels?: number
  isNormalized?: boolean
  colors?: ColorConfig
  locale?: Locale
  labels?: Labels
  fontSize?: number
  emptyState?: ReactNode
  totalCount?: number
  style?: CSSProperties
  className?: string
  children: ReactNode
}

/**
 * Calendar Heatmap
 *
 * A GitHub-style contribution calendar showing daily activity over months and years.
 * Each cell represents one day, arranged in weeks (rows) and months (columns).
 *
 * @example
 * ```tsx
 * <CalendarHeatmap data={data} weekStart={1} continuousMonths>
 *   <CalendarHeatmapBody>
 *     {({ activity, dayIndex, weekIndex }) => (
 *       <CalendarHeatmapBlock
 *         activity={activity}
 *         dayIndex={dayIndex}
 *         weekIndex={weekIndex}
 *       />
 *     )}
 *   </CalendarHeatmapBody>
 *   <CalendarHeatmapFooter>
 *     <CalendarHeatmapStat />
 *     <CalendarHeatmapLegend />
 *   </CalendarHeatmapFooter>
 * </CalendarHeatmap>
 * ```
 *
 * @param data - Array of activities with date (YYYY-MM-DD) and value
 * @param weekStart - First day of week (0=Sunday, 1=Monday). Default: 0
 * @param continuousMonths - Display months continuously vs. grouped by year. Default: true
 * @param hasEmptyColumn - Add empty column between months. Default: false
 * @param blockAspectRatio - Width/height ratio of blocks. Default: 1
 * @param levels - Total number of legend cells (including empty when not normalized). Default: 5
 * @param isNormalized - When true, uses min-max normalization across the dataset (suitable for signed values). When false (default), treats 0 as empty and scales from 0 to max.
 */
export const CalendarHeatmap = ({
  data,
  weekStart = 0,
  continuousMonths = true,
  hasEmptyColumn = false,
  blockSize = 12,
  blockMargin = 4,
  blockRadius = 2,
  blockAspectRatio = 1,
  levels: levelsProp = 5,
  isNormalized = false,
  colors,
  locale,
  labels: labelsProp,
  fontSize = 14,
  emptyState,
  totalCount: totalCountProp,
  style = EMPTY_STYLE,
  className,
  children,
  ...props
}: CalendarHeatmapProps) => {
  const levels = Math.max(1, levelsProp)

  const dataWithLevels = useMemo((): ActivityWithLevel[] => {
    if (data.length === 0) return []

    const maxCount = data.reduce((max, d) => Math.max(max, d.value), 1)
    const minCount = isNormalized
      ? data.reduce((min, d) => Math.min(min, d.value), Infinity)
      : 0

    return data.map((activity) => ({
      ...activity,
      level: calculateLevel(
        activity.value,
        minCount,
        maxCount,
        levels,
        isNormalized
      ),
    }))
  }, [data, levels, isNormalized])

  const yearRows = useMemo(
    () =>
      continuousMonths
        ? groupContinuous(dataWithLevels, weekStart)
        : groupByYearAndMonth(dataWithLevels, weekStart, hasEmptyColumn),
    [dataWithLevels, weekStart, hasEmptyColumn, continuousMonths]
  )
  const weeks = useMemo(() => yearRows.flatMap((r) => r.weeks), [yearRows])

  const labels = useMemo(
    () => ({
      months: generateMonthLabels(locale),
      weekdays: generateWeekdayLabels(locale),
      cellLabel: "{{date}}: {{value}} contributions",
      heatmapLabel: "Contribution heatmap for {{year}}",
      legendLabel: "Activity intensity legend",
      legendLevelLabel: "{{level}} contributions",
      ...labelsProp,
    }),
    [locale, labelsProp]
  )
  const labelHeight = fontSize + LABEL_MARGIN

  const year =
    data.length > 0 ? getYear(parseISO(data[0].date)) : new Date().getFullYear()

  const totalCount =
    typeof totalCountProp === "number"
      ? totalCountProp
      : dataWithLevels.reduce((sum, activity) => sum + activity.value, 0)

  const blockWidth = blockSize * blockAspectRatio
  const width = weeks.length * (blockWidth + blockMargin) - blockMargin
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin

  const contextValue = useMemo<CalendarHeatmapContextType>(
    () => ({
      data: dataWithLevels,
      weeks,
      yearRows,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      labelHeight,
      levels,
      isNormalized,
      totalCount,
      weekStart,
      year,
      width,
      height,
      hasEmptyColumn,
      continuousMonths,
      locale,
      colors,
    }),
    [
      dataWithLevels,
      weeks,
      yearRows,
      blockMargin,
      blockRadius,
      blockSize,
      blockAspectRatio,
      blockWidth,
      fontSize,
      labels,
      labelHeight,
      levels,
      isNormalized,
      totalCount,
      weekStart,
      year,
      width,
      height,
      hasEmptyColumn,
      continuousMonths,
      locale,
      colors,
    ]
  )

  if (data.length === 0) {
    return emptyState ? emptyState : null
  }

  return (
    <CalendarHeatmapContext value={contextValue}>
      <div
        data-slot="calendar-heatmap"
        className={cn("flex w-max max-w-full flex-col gap-2 p-4", className)}
        style={{ fontSize, ...style }}
        {...props}
      >
        {children}
      </div>
    </CalendarHeatmapContext>
  )
}
