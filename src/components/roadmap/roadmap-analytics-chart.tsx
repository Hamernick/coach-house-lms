"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { RoadmapAnalyticsSummary } from "@/lib/roadmap/analytics"

const chartConfig = {
  views: {
    label: "Page views",
    color: "var(--chart-1)",
  },
  cta: {
    label: "CTA clicks",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function RoadmapAnalyticsChart({ summary }: { summary: RoadmapAnalyticsSummary | null }) {
  const data = React.useMemo(() => {
    if (!summary) return []
    const merged: Record<string, { date: string; views: number; cta: number }> = {}
    summary.dailyViews.forEach((point) => {
      merged[point.date] = {
        date: point.date,
        views: point.count,
        cta: merged[point.date]?.cta ?? 0,
      }
    })
    summary.dailyCtaClicks.forEach((point) => {
      merged[point.date] = {
        date: point.date,
        views: merged[point.date]?.views ?? 0,
        cta: point.count,
      }
    })
    return Object.values(merged).sort((a, b) => a.date.localeCompare(b.date)).slice(-14)
  }, [summary])

  if (!summary || data.length === 0) {
    return (
      <Card className="border border-border/70 bg-muted/30">
        <CardHeader>
          <CardTitle>Roadmap engagement</CardTitle>
          <CardDescription>No public activity yet — share your roadmap to start collecting data.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="py-0">
      <CardHeader className="flex flex-col items-stretch border-b !p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3 sm:!py-0">
          <CardTitle>Roadmap engagement</CardTitle>
          <CardDescription>Daily views vs CTA clicks (last 14 days)</CardDescription>
        </div>
        <div className="flex">
          {[
            { key: "views", value: summary.totalViews },
            { key: "cta", value: summary.totalCtaClicks },
          ].map((metric) => (
            <div
              key={metric.key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6"
            >
              <span className="text-xs text-muted-foreground">{chartConfig[metric.key as keyof typeof chartConfig].label}</span>
              <span className="text-lg font-bold leading-none sm:text-3xl">{metric.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <BarChart data={data} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => formatDate(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[160px]"
                  formatter={(value, name) => (
                    <span className="flex w-full items-center justify-between">
                      <span>{chartConfig[name as keyof typeof chartConfig]?.label ?? name}</span>
                      <span className="font-mono">{Number(value).toLocaleString()}</span>
                    </span>
                  )}
                  labelFormatter={(value) => formatDate(value, true)}
                />
              }
            />
            <Bar dataKey="views" fill="var(--color-views)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cta" stackId="cta" fill="var(--color-cta)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function formatDate(value: string, includeYear = false) {
  const date = new Date(value)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  })
}
