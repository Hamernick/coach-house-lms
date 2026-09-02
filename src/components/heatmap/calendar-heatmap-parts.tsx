import { getYear, parseISO } from "date-fns"
import type { HTMLAttributes, ReactNode } from "react"
import { Fragment, useMemo } from "react"

import { cn } from "@/lib/utils"
import { useCalendarHeatmap } from "./calendar-heatmap-core"
import {
  colorStepCount,
  getLevelFill,
  getMonthLabels,
  type ActivityWithLevel,
} from "./calendar-heatmap-model"

export type CalendarHeatmapBlockProps = HTMLAttributes<SVGRectElement> & {
  activity: ActivityWithLevel
  dayIndex: number
  weekIndex: number
  highlighted?: boolean
  onCellClick?: (activity: ActivityWithLevel) => void
  onCellHover?: (activity: ActivityWithLevel | null) => void
}

export const CalendarHeatmapBlock = ({
  ref,
  activity,
  dayIndex,
  weekIndex,
  highlighted = false,
  onCellClick,
  onCellHover,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  className,
  style: styleProp,
  ...props
}: CalendarHeatmapBlockProps & {
  ref?: React.RefObject<SVGRectElement | null>
}) => {
  const {
    blockSize,
    blockWidth,
    blockMargin,
    blockRadius,
    labelHeight,
    labels,
    levels,
    isNormalized,
    colors,
  } = useCalendarHeatmap()

  const level = Math.max(
    0,
    Math.min(colorStepCount(levels, isNormalized), activity.level)
  )

  const ariaLabel = (labels.cellLabel ?? "{{date}}: {{value}} contributions")
    .replace("{{date}}", activity.date)
    .replace("{{value}}", String(activity.value))

  return (
    <rect
      ref={ref}
      data-slot="calendar-heatmap-block"
      role={onCellClick ? "button" : "img"}
      tabIndex={onCellClick ? 0 : -1}
      aria-label={ariaLabel}
      className={cn(
        "motion-safe:transition-opacity motion-safe:hover:opacity-70",
        onCellClick &&
          "focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
        className
      )}
      data-value={activity.value}
      data-date={activity.date}
      data-level={level}
      data-highlighted={highlighted || undefined}
      height={blockSize}
      rx={blockRadius}
      ry={blockRadius}
      width={blockWidth}
      x={(blockWidth + blockMargin) * weekIndex}
      y={labelHeight + (blockSize + blockMargin) * dayIndex}
      style={{
        fill: getLevelFill(level, levels, isNormalized, highlighted, colors),
        ...styleProp,
      }}
      onClick={(event) => {
        onCellClick?.(activity)
        onClick?.(event)
      }}
      onKeyDown={(event) => {
        if (onCellClick && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault()
          onCellClick(activity)
        }
        onKeyDown?.(event)
      }}
      onMouseEnter={(event) => {
        onCellHover?.(activity)
        onMouseEnter?.(event)
      }}
      onMouseLeave={(event) => {
        onCellHover?.(null)
        onMouseLeave?.(event)
      }}
      {...props}
    />
  )
}
CalendarHeatmapBlock.displayName = "CalendarHeatmapBlock"

export type CalendarHeatmapBodyProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  hideMonthLabels?: boolean
  hideWeekdayLabels?: boolean
  hideYearLabels?: boolean
  className?: string
  labelClassName?: string
  yearClassName?: string
  children: (props: {
    activity: ActivityWithLevel
    dayIndex: number
    weekIndex: number
  }) => ReactNode
  renderYearFooter?: (props: { year: number; totalCount: number }) => ReactNode
}

export const CalendarHeatmapBody = ({
  hideMonthLabels = false,
  hideWeekdayLabels = false,
  hideYearLabels = false,
  className,
  labelClassName,
  yearClassName,
  children,
  renderYearFooter,
  ...props
}: CalendarHeatmapBodyProps) => {
  const {
    yearRows,
    blockSize,
    blockWidth,
    blockMargin,
    labels,
    labelHeight,
    fontSize,
    weekStart,
    data,
  } = useCalendarHeatmap()

  const weekdayLabelWidth = hideWeekdayLabels ? 0 : 40
  const strokePadding = 3

  const rowData = useMemo(() => {
    return yearRows.map((yearRow) => {
      const width =
        yearRow.weeks.length * (blockWidth + blockMargin) - blockMargin
      const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin
      const monthLabels = getMonthLabels(yearRow.weeks, labels.months)
      const yearTotalCount = data
        .filter((activity) => getYear(parseISO(activity.date)) === yearRow.year)
        .reduce((sum, activity) => sum + activity.value, 0)

      return {
        yearRow,
        width,
        height,
        monthLabels,
        yearTotalCount,
      }
    })
  }, [
    yearRows,
    blockSize,
    blockWidth,
    blockMargin,
    labelHeight,
    labels.months,
    data,
  ])

  const maxWidth = Math.max(...rowData.map((r) => r.width))
  const totalWidth = weekdayLabelWidth + maxWidth + strokePadding * 2

  return (
    <div
      data-slot="calendar-heatmap-body"
      className={cn(
        "flex max-w-full flex-col gap-6 overflow-x-auto overflow-y-hidden py-4",
        className
      )}
      {...props}
    >
      {rowData.map(({ yearRow, height, monthLabels, yearTotalCount }) => (
        <div key={`year-row-${yearRow.year}`}>
          {!hideYearLabels && (
            <div className={cn("text-muted-foreground mb-2", yearClassName)}>
              {yearRow.year}
            </div>
          )}
          <svg
            role="img"
            aria-label={(
              labels.heatmapLabel ?? "Contribution heatmap for {{year}}"
            ).replace("{{year}}", String(yearRow.year))}
            className="focus-visible:ring-ring block overflow-visible rounded-sm focus-visible:ring-2 focus-visible:outline-none"
            height={height + strokePadding * 2}
            viewBox={`0 0 ${totalWidth} ${height + strokePadding * 2}`}
            width={totalWidth}
          >
            <g transform={`translate(0, ${strokePadding})`}>
              {!hideMonthLabels && (
                <g className={cn("fill-current font-mono", labelClassName)}>
                  {monthLabels.map(({ label, weekIndex }) => (
                    <text
                      dominantBaseline="hanging"
                      key={`${yearRow.year}-${weekIndex}`}
                      x={
                        weekdayLabelWidth +
                        strokePadding +
                        (blockWidth + blockMargin) * weekIndex
                      }
                      style={{ fontSize: `${fontSize * 0.75}px` }}
                    >
                      {label}
                    </text>
                  ))}
                </g>
              )}
              {!hideWeekdayLabels && (
                <g
                  className={cn(
                    "fill-current font-mono text-xs",
                    labelClassName
                  )}
                >
                  {labels.weekdays?.map((label, dayIndex) => {
                    const adjustedIndex = (dayIndex + weekStart) % 7
                    const adjustedLabel =
                      labels.weekdays?.[adjustedIndex] || label

                    return (
                      <text
                        key={`weekday-${yearRow.year}-${label}`}
                        x={0}
                        y={
                          labelHeight +
                          (blockSize + blockMargin) * dayIndex +
                          blockSize / 2
                        }
                        dominantBaseline="middle"
                        textAnchor="start"
                        style={{ fontSize: `${fontSize * 0.75}px` }}
                      >
                        {adjustedLabel}
                      </text>
                    )
                  })}
                </g>
              )}
              <g
                transform={`translate(${weekdayLabelWidth + strokePadding}, 0)`}
              >
                {yearRow.weeks.map((week, weekIndex) =>
                  week.map((activity, dayIndex) => {
                    if (!activity) {
                      return null
                    }

                    return (
                      <Fragment key={`${yearRow.year}-${activity.date}`}>
                        {children({ activity, dayIndex, weekIndex })}
                      </Fragment>
                    )
                  })
                )}
              </g>
            </g>
          </svg>
          {renderYearFooter?.({
            year: yearRow.year,
            totalCount: yearTotalCount,
          })}
        </div>
      ))}
    </div>
  )
}

export type CalendarHeatmapFooterProps = HTMLAttributes<HTMLDivElement>

export const CalendarHeatmapFooter = ({
  className,
  ...props
}: CalendarHeatmapFooterProps) => (
  <div
    data-slot="calendar-heatmap-footer"
    className={cn(
      "flex flex-wrap gap-1 whitespace-nowrap sm:gap-x-4",
      className
    )}
    {...props}
  />
)

export type CalendarHeatmapStatProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  compute?: (data: ActivityWithLevel[]) => number | string
  label?: string // Template overriding labels.stat. Placeholders: {{value}}, {{year}}
  children?: (result: {
    value: number | string
    data: ActivityWithLevel[]
    year: number
  }) => ReactNode
}

export const CalendarHeatmapStat = ({
  compute,
  label,
  className,
  children,
  ...props
}: CalendarHeatmapStatProps) => {
  const { data, totalCount, year, labels } = useCalendarHeatmap()

  const value = compute ? compute(data) : totalCount

  if (children) {
    return <>{children({ value, data, year })}</>
  }

  const template = label ?? labels.stat ?? "{{value}} contributions in {{year}}"

  return (
    <div
      data-slot="calendar-heatmap-stat"
      className={cn("text-muted-foreground tabular-nums", className)}
      {...props}
    >
      {template
        .replace("{{value}}", String(value))
        .replace("{{year}}", String(year))}
    </div>
  )
}

export type CalendarHeatmapLegendProps = Omit<
  HTMLAttributes<HTMLFieldSetElement>,
  "children"
> & {
  labels?: { less?: string; more?: string }
  children?: (props: { level: number }) => ReactNode
}

export const CalendarHeatmapLegend = ({
  labels: labelsProp,
  className,
  children,
  ...props
}: CalendarHeatmapLegendProps) => {
  const {
    levels,
    isNormalized,
    blockSize,
    blockWidth,
    blockRadius,
    colors,
    labels,
  } = useCalendarHeatmap()

  const lessLabel = labelsProp?.less ?? "Less"
  const moreLabel = labelsProp?.more ?? "More"

  const legendLevels = Array.from({ length: levels }, (_, i) =>
    isNormalized ? i + 1 : i
  )

  return (
    <fieldset
      data-slot="calendar-heatmap-legend"
      aria-label={labels.legendLabel ?? "Activity intensity legend"}
      className={cn(
        "text-muted-foreground ml-auto flex items-center gap-1",
        className
      )}
      {...props}
    >
      <span className="mr-1 text-xs font-medium">{lessLabel}</span>
      {legendLevels.map((level) =>
        children ? (
          <Fragment key={`legend-level-${level}`}>
            {children({ level })}
          </Fragment>
        ) : (
          <svg
            role="img"
            aria-label={(
              labels.legendLevelLabel ?? "{{level}} contributions"
            ).replace("{{level}}", String(level))}
            height={blockSize}
            key={`legend-level-${level}`}
            width={blockWidth}
          >
            <rect
              data-level={level}
              height={blockSize}
              rx={blockRadius}
              ry={blockRadius}
              width={blockWidth}
              style={{
                fill: getLevelFill(level, levels, isNormalized, false, colors),
              }}
            />
          </svg>
        )
      )}
      <span className="ml-1 text-xs font-medium">{moreLabel}</span>
    </fieldset>
  )
}
