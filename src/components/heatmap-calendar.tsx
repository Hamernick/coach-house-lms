"use client"

import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

import {
  DEFAULT_LEVEL_CLASS_NAMES,
  buildHeatmapCalendarModel,
  resolveHeatmapAxisLabels,
  resolveHeatmapLegend,
  resolveWeekdayLabel,
} from "./heatmap-calendar-model"
import type {
  HeatmapCalendarProps,
  HeatmapCell,
  HeatmapDatum,
} from "./heatmap-calendar-types"

export type { HeatmapCell, HeatmapDatum }

const HEATMAP_LEVELS: [0, 1, 2, 3, 4] = [0, 1, 2, 3, 4]

function HeatmapCellButton<TMeta>({
  cell,
  cellSize,
  levelClassNames,
  onCellClick,
  renderTooltip,
}: {
  cell: HeatmapCell<TMeta>
  cellSize: number
  levelClassNames: [string, string, string, string, string]
  onCellClick?: (cell: HeatmapCell<TMeta>) => void
  renderTooltip?: (cell: HeatmapCell<TMeta>) => React.ReactNode
}) {
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
      <HoverCard key={cell.key} openDelay={120} closeDelay={100}>
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
  const resolvedAxisLabels = resolveHeatmapAxisLabels(axisLabels)
  const resolvedLegend = resolveHeatmapLegend(legend)
  const { monthLabels, weeks } = buildHeatmapCalendarModel({
    axisLabels: resolvedAxisLabels,
    data,
    endDate,
    rangeDays,
    weekStartsOn,
  })

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
                {resolvedAxisLabels.weekdayIndices.includes(index)
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
                {week.map((cell) => (
                  <HeatmapCellButton
                    key={cell.key}
                    cell={cell}
                    cellSize={cellSize}
                    levelClassNames={levelClassNames}
                    onCellClick={onCellClick}
                    renderTooltip={renderTooltip}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {legend !== false ? (
        renderLegend ? (
          renderLegend({
            levels: HEATMAP_LEVELS,
            levelClassNames,
            lessLabel: resolvedLegend.lessLabel,
            moreLabel: resolvedLegend.moreLabel,
          })
        ) : (
          <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground">
            <span>{resolvedLegend.lessLabel}</span>
            <div className="flex items-center gap-1">
              {HEATMAP_LEVELS.map((level) => (
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
