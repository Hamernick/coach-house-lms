"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

import type {
  EmailOpsHeatmapPoint,
  EmailOpsMetricPoint,
  EmailOpsSummaryMetric,
} from "../types"
import { EmailOpsHeatmap } from "./email-ops-heatmap"

const emailOpsChartConfig = {
  sent: {
    label: "Sent",
    color: "var(--chart-1)",
  },
  opens: {
    label: "Opens",
    color: "var(--chart-2)",
  },
  clicks: {
    label: "Clicks",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig

export function EmailOpsAnalyticsPanel({
  heatmap,
  metricTrend,
  summaryMetrics,
}: {
  heatmap: EmailOpsHeatmapPoint[]
  metricTrend: EmailOpsMetricPoint[]
  summaryMetrics: EmailOpsSummaryMetric[]
}) {
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-border/60 bg-background/80 p-3"
          >
            <p className="text-[11px] font-medium text-muted-foreground">
              {metric.label}
            </p>
            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-semibold tracking-tight">
                {metric.value}
              </p>
              <p className="pb-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-300">
                {metric.delta}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)]">
        <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Delivery trend</h2>
              <p className="text-xs text-muted-foreground">
                Sent, opened, and clicked by week.
              </p>
            </div>
          </div>
          <ChartContainer
            config={emailOpsChartConfig}
            className="aspect-auto h-[220px] w-full"
          >
            <BarChart
              accessibilityLayer
              data={metricTrend}
              margin={{ left: -20, right: 12 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar
                dataKey="sent"
                fill="var(--color-sent)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="opens"
                fill="var(--color-opens)"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                dataKey="clicks"
                fill="var(--color-clicks)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="rounded-2xl border border-border/60 bg-background/80 p-3">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Send-time fit</h2>
            <p className="text-xs text-muted-foreground">
              Early signal for weekly scheduling.
            </p>
          </div>
          <EmailOpsHeatmap points={heatmap} />
        </div>
      </div>
    </div>
  )
}
