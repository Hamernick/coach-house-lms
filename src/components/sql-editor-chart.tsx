"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export function QueryResultChart({
  data,
  xAxis,
  yAxis,
}: {
  data: any[]
  xAxis: string
  yAxis: string
}) {
  const chartConfig = {
    [yAxis]: {
      label: yAxis,
      color: "var(--chart-1)",
    },
  } satisfies ChartConfig

  return (
    <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        margin={{
          left: -24,
          right: 12,
        }}
      >
        <CartesianGrid vertical={false} />
        <XAxis dataKey={xAxis} tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} />
        <YAxis
          dataKey={yAxis}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickCount={5}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent className="w-[150px]" indicator="dot" />} />
        <Bar dataKey={yAxis} fill={`var(--color-${yAxis})`} />
      </BarChart>
    </ChartContainer>
  )
}
