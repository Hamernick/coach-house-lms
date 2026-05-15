import type { ReactNode } from "react"

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

export type AxisLabelConfig = {
  showMonths?: boolean
  showWeekdays?: boolean
  weekdayIndices?: number[]
  monthFormat?: "short" | "long" | "numeric"
  minWeekSpacing?: number
}

export type LegendConfig = {
  lessLabel?: string
  moreLabel?: string
}

export type HeatmapCalendarProps<TMeta = unknown> = {
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
